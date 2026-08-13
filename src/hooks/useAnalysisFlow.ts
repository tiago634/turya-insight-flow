import { useEffect, useRef, useState } from "react";
import {
  MAX_POLLING_TIME,
  POLLING_INTERVAL,
  SECONDARY_FOLLOWUP_MAX_MS,
  SECONDARY_FOLLOWUP_MS,
  STATUS_CHECK_URL,
} from "@/lib/turya/config";
import {
  fetchAnalysisStatus,
  isTuryaDiagEnabled,
  logTuryaPollingDiagnostics,
} from "@/lib/turya/api";
import { base64ToBlob, extractSecondarySpreadsheet } from "@/lib/turya/decode";

export type AppState = "upload" | "processing" | "completed" | "error";

export function useAnalysisFlow() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [htmlBlob, setHtmlBlob] = useState<Blob | null>(null);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [docxFileName, setDocxFileName] = useState<string>("Proposta_Comercial.docx");
  const [secondaryFileBlob, setSecondaryFileBlob] = useState<Blob | null>(null);
  const [secondaryFileName, setSecondaryFileName] = useState<string>("Analise_Turya_XLSX");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const secondaryFollowupRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTuryaDiagEnabled()) {
      console.info(
        "[Turya DIAG] Backend do polling (confira se é o Railway certo):",
        STATUS_CHECK_URL
      );
    }
  }, []);

  const checkAnalysisStatus = async (sessionId: string) => {
    try {
      const response = await fetchAnalysisStatus(sessionId);

      if (!response.ok) {
        throw new Error(`Erro ao verificar status: ${response.status}`);
      }

      const text = await response.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("Polling: resposta não é JSON válido. Tamanho:", text.length, parseErr);
        return;
      }

      const htmlContent = typeof data.html_content === "string" ? data.html_content : "";
      const docxContent = typeof data.docx_content === "string" ? data.docx_content : "";
      const status = typeof data.status === "string" ? data.status : undefined;
      const hasHtml = htmlContent.length > 0;
      const hasDocx = docxContent.length > 0;
      const secondaryPreview = extractSecondarySpreadsheet(data);
      const hasSheet = !!(secondaryPreview?.blob && secondaryPreview.blob.size > 0);
      const hasPrimary = hasHtml || hasDocx;
      // Conclui com HTML/Word OU só planilha (fluxo D&O às vezes só devolve o XLS).
      const isCompleted =
        status === "completed" || ((hasPrimary || hasSheet) && status !== "error");
      if (isCompleted && (hasPrimary || hasSheet)) {
        try {
          const htmlBlobDecoded = hasHtml ? base64ToBlob(htmlContent, "text/html") : null;
          const docxBlobDecoded = hasDocx
            ? base64ToBlob(
                docxContent,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              )
            : null;
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          const secondary = secondaryPreview;
          if (isTuryaDiagEnabled()) {
            logTuryaPollingDiagnostics("conclusao", STATUS_CHECK_URL, sessionId, data, secondary);
          } else if (import.meta.env.DEV) {
            console.log(
              "[Turya] Polling concluído. Documento principal:",
              hasDocx ? "Word (.docx)" : hasHtml ? "HTML" : "apenas planilha",
              "| Arquivo secundário:",
              secondary ? `${secondary.fileName} (${secondary.blob.size} bytes)` : "não encontrado no JSON",
              "| chaves no topo:",
              Object.keys(data)
            );
          }
          setSecondaryFileBlob(secondary?.blob ?? null);
          setSecondaryFileName(secondary?.fileName ?? "Analise_Turya_XLSX");

          setHtmlBlob(htmlBlobDecoded);
          setDocxBlob(docxBlobDecoded);
          setDocxFileName(
            typeof data.docx_filename === "string" && data.docx_filename.trim()
              ? data.docx_filename.trim()
              : "Proposta_Comercial.docx"
          );
          setAppState("completed");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (blobErr) {
          console.error("Polling: erro ao converter documento para blob", blobErr);
        }
        return;
      }

      if (status === "error") {
        // Parar polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setErrorMessage(
          typeof data.error === "string" ? data.error : "Erro ao processar análise"
        );
        setAppState("error");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (status === "processing" && !hasPrimary && !hasSheet) {
        console.log("Polling:", status, "| backend:", STATUS_CHECK_URL);
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    }
  };

  useEffect(() => {
    if (appState === "processing" && sessionId) {
      pollingStartTimeRef.current = Date.now();
      console.log("Polling iniciado. Backend:", STATUS_CHECK_URL, "| Session:", sessionId);
      checkAnalysisStatus(sessionId);

      // Configurar polling periódico
      pollingIntervalRef.current = window.setInterval(() => {
        // Verificar timeout
        if (pollingStartTimeRef.current && Date.now() - pollingStartTimeRef.current > MAX_POLLING_TIME) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setErrorMessage("Tempo limite excedido. Por favor, tente novamente.");
          setAppState("error");
          return;
        }

        checkAnalysisStatus(sessionId);
      }, POLLING_INTERVAL);
    }

    // Cleanup ao desmontar ou mudar de estado
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [appState, sessionId]);

  // Após o HTML estar pronto, o arquivo secundário pode chegar ~1s depois no mesmo endpoint.
  useEffect(() => {
    const needsSecondary =
      appState === "completed" &&
      !!sessionId &&
      (!secondaryFileBlob || secondaryFileBlob.size === 0);

    if (!needsSecondary) return;

    const startedAt = Date.now();

    const fetchSecondary = async () => {
      if (Date.now() - startedAt > SECONDARY_FOLLOWUP_MAX_MS) {
        if (secondaryFollowupRef.current !== null) {
          window.clearInterval(secondaryFollowupRef.current);
          secondaryFollowupRef.current = null;
        }
        return;
      }
      try {
        const response = await fetchAnalysisStatus(sessionId);
        if (!response.ok) return;
        const text = await response.text();
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(text);
        } catch {
          return;
        }
        const secondary = extractSecondarySpreadsheet(data);
        if (isTuryaDiagEnabled()) {
          logTuryaPollingDiagnostics("followup", STATUS_CHECK_URL, sessionId, data, secondary);
        }
        if (secondary?.blob && secondary.blob.size > 0) {
          setSecondaryFileBlob(secondary.blob);
          setSecondaryFileName(secondary.fileName);
          if (import.meta.env.DEV) {
            console.log(
              "[Turya] Arquivo secundário obtido após HTML:",
              secondary.fileName,
              secondary.blob.size,
              "bytes"
            );
          }
          if (secondaryFollowupRef.current !== null) {
            window.clearInterval(secondaryFollowupRef.current);
            secondaryFollowupRef.current = null;
          }
        }
      } catch {
        /* ignora falhas pontuais */
      }
    };

    void fetchSecondary();
    secondaryFollowupRef.current = window.setInterval(fetchSecondary, SECONDARY_FOLLOWUP_MS);

    return () => {
      if (secondaryFollowupRef.current !== null) {
        window.clearInterval(secondaryFollowupRef.current);
        secondaryFollowupRef.current = null;
      }
    };
  }, [appState, sessionId, secondaryFileBlob]);

  const handleStartProcessing = (newSessionId: string) => {
    setSessionId(newSessionId);
    setAppState("processing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSuccess = (blob: Blob) => {
    // Parar polling se estiver ativo (caso resposta tenha vindo síncrona)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setSecondaryFileBlob(null);
    setSecondaryFileName("Analise_Turya_XLSX");
    setDocxBlob(null);
    setDocxFileName("Proposta_Comercial.docx");
    setHtmlBlob(blob);
    setAppState("completed");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleError = (message: string) => {
    // Parar polling se estiver ativo
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setErrorMessage(message);
    setAppState("error");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    // Parar polling se estiver ativo
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (secondaryFollowupRef.current !== null) {
      window.clearInterval(secondaryFollowupRef.current);
      secondaryFollowupRef.current = null;
    }

    setAppState("upload");
    setHtmlBlob(null);
    setDocxBlob(null);
    setDocxFileName("Proposta_Comercial.docx");
    setSecondaryFileBlob(null);
    setSecondaryFileName("Analise_Turya_XLSX");
    setErrorMessage("");
    setSessionId(null);
    pollingStartTimeRef.current = null;
  };

  return {
    appState,
    htmlBlob,
    docxBlob,
    docxFileName,
    secondaryFileBlob,
    secondaryFileName,
    errorMessage,
    sessionId,
    handleStartProcessing,
    handleSuccess,
    handleError,
    handleReset,
  };
}
