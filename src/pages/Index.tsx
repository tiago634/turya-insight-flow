 import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import UploadZone from "@/components/UploadZone";
import LoadingAnalysis from "@/components/LoadingAnalysis";
import DownloadReport from "@/components/DownloadReport";
import TermsOfUseModal from "@/components/TermsOfUseModal";
import ErrorMessage from "@/components/ErrorMessage";
import BenefitsSection from "@/components/BenefitsSection";
import Footer from "@/components/Footer";

type AppState = "upload" | "processing" | "completed" | "error";

const POLLING_INTERVAL = 3000; // 3 segundos
const MAX_POLLING_TIME = 10 * 60 * 1000; // 10 minutos (tempo máximo de espera pelo resultado)
/** O backend às vezes grava o XLS/XLSX no Redis pouco depois do HTML; buscamos de novo por alguns segundos. */
const SECONDARY_FOLLOWUP_MS = 1000;
const SECONDARY_FOLLOWUP_MAX_MS = 20_000;
// URL do servidor local para verificar status
const STATUS_CHECK_URL = import.meta.env.VITE_WEBHOOK_SERVER_URL || "http://localhost:3001";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("upload");
  const [htmlBlob, setHtmlBlob] = useState<Blob | null>(null);
  const [secondaryFileBlob, setSecondaryFileBlob] = useState<Blob | null>(null);
  const [secondaryFileName, setSecondaryFileName] = useState<string>("Analise_Turya_XLSX");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const secondaryFollowupRef = useRef<number | null>(null);

  // Termos: mostram apenas na primeira tentativa desta sessão (e re-aparecem após refresh).
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const termsResolverRef = useRef<((val: boolean) => void) | null>(null);

  const requestTermsAcceptance = () => {
    setTermsOpen(true);
    return new Promise<boolean>((resolve) => {
      termsResolverRef.current = resolve;
    });
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setTermsOpen(false);
    termsResolverRef.current?.(true);
    termsResolverRef.current = null;
  };

  const handleCancelTerms = () => {
    setTermsOpen(false);
    termsResolverRef.current?.(false);
    termsResolverRef.current = null;
  };

  const handleOpenTermsFromFooter = () => {
    // Abre o modal para leitura.
    // Se o usuário concordar, o aceite será aplicado da mesma forma do primeiro upload.
    setTermsOpen(true);
  };

  const checkAnalysisStatus = async (sessionId: string) => {
    try {
      // Query param evita cache do navegador (304) e garante resposta sempre atual
      const url = `${STATUS_CHECK_URL}/api/analysis/${sessionId}?t=${Date.now()}`;
      const response = await fetch(url);
      
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
      const status = typeof data.status === "string" ? data.status : undefined;
      const hasHtml = htmlContent.length > 0;
      const isCompleted = status === "completed" || (hasHtml && status !== "error");
      if (isCompleted && hasHtml) {
        try {
          const binaryString = atob(htmlContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "text/html" });
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          const secondary = extractSecondarySpreadsheet(data);
          if (import.meta.env.DEV) {
            console.log(
              "[Turya] Polling concluído. Arquivo secundário:",
              secondary ? `${secondary.fileName} (${secondary.blob.size} bytes)` : "não encontrado no JSON",
              "| chaves no topo:",
              Object.keys(data)
            );
          }
          setSecondaryFileBlob(secondary?.blob ?? null);
          setSecondaryFileName(secondary?.fileName ?? "Analise_Turya_XLSX");

          setHtmlBlob(blob);
          setAppState("completed");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (blobErr) {
          console.error("Polling: erro ao converter html_content para blob", blobErr);
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

      if (status === "processing" && !hasHtml) {
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
        const url = `${STATUS_CHECK_URL}/api/analysis/${sessionId}?t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) return;
        const text = await response.text();
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(text);
        } catch {
          return;
        }
        const secondary = extractSecondarySpreadsheet(data);
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
    setSecondaryFileBlob(null);
    setSecondaryFileName("Analise_Turya_XLSX");
    setErrorMessage("");
    setSessionId(null);
    pollingStartTimeRef.current = null;
  };

  if (appState === "processing" && sessionId) {
    return (
      <LoadingAnalysis
        sessionId={sessionId}
        statusCheckUrl={STATUS_CHECK_URL}
      />
    );
  }

  if (appState === "completed") {
    return (
      <DownloadReport
        htmlBlob={htmlBlob}
        secondaryFileBlob={secondaryFileBlob}
        secondaryFileName={secondaryFileName}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TermsOfUseModal open={termsOpen} onAccept={handleAcceptTerms} onCancel={handleCancelTerms} />

      <main>
        <HeroSection />

        {appState === "upload" && (
          <UploadZone 
            onSuccess={handleSuccess}
            onError={handleError}
            onStartProcessing={handleStartProcessing}
            sessionId={sessionId}
            termsAccepted={termsAccepted}
            onRequestTerms={requestTermsAcceptance}
          />
        )}

        {appState === "error" && (
          <ErrorMessage message={errorMessage} onRetry={handleReset} />
        )}

        <BenefitsSection />
      </main>

      <Footer onOpenTerms={handleOpenTermsFromFooter} />
    </div>
  );
};

export default Index;

function extractSecondarySpreadsheet(data: Record<string, unknown>): { blob: Blob; fileName: string } | null {
  const defaultFileName = "Analise_Turya_XLSX";

  const directKeyCandidates = [
    "Analise_Turya_XLSX",
    "Analise_Turya_XLSX.xls",
    "analise_turya_xlsx",
    "analise_turya_xls",
    "xlsx_content",
    "xls_content",
    "excel_content",
    "excel_base64",
    "spreadsheet_base64",
    "secondary_file_content",
    "arquivo_extra_content",
    "secondary_file_base64",
    "excel_file",
  ];

  // 1) Tenta chaves diretas conhecidas.
  for (const key of directKeyCandidates) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) {
      const decoded = decodeSpreadsheetFromBase64String(v.trim(), defaultFileName);
      if (decoded) return decoded;
    }
  }

  // 2) Busca recursiva por objetos com filename + conteúdo base64.
  const queue: unknown[] = [data];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }

    const obj = current as Record<string, unknown>;

    const fileName = getFirstString(
      obj,
      ["fileName", "filename", "name", "arquivo", "output_name"],
      defaultFileName
    );
    const normalizedFileName = fileName.toLowerCase();

    // Conteúdos comuns: planilha pode vir como XLS (OLE) ou XLSX (ZIP).
    for (const contentKey of [
      "content",
      "base64",
      "data",
      "file",
      "value",
      "xlsx",
      "xls",
      "buffer",
      "binary",
      "payload",
    ]) {
      const value = obj[contentKey];
      if (typeof value !== "string" || !value.trim()) continue;

      const looksLikeSpreadsheetName =
        normalizedFileName.includes("xlsx") ||
        normalizedFileName.includes("xls") ||
        normalizedFileName.includes("analise_turya") ||
        normalizedFileName.includes("excel");

      const shouldTryAsSpreadsheet =
        looksLikeSpreadsheetName ||
        contentKey === "xlsx" ||
        contentKey === "xls";

      if (shouldTryAsSpreadsheet) {
        const decoded = decodeSpreadsheetFromBase64String(value.trim(), fileName);
        if (decoded) return decoded;
      }

      const decoded = decodeSpreadsheetFromBase64String(value.trim(), defaultFileName);
      if (decoded) return decoded;
    }

    // Explora recursivamente.
    for (const v of Object.values(obj)) {
      if (typeof v === "object" && v !== null) queue.push(v);
    }
  }

  // 3) Último recurso: qualquer string longa em base64 que decodifique para XLS/XLSX (chaves imprevistas no backend).
  const loose = findSpreadsheetInUnknownStrings(data);
  return loose;
}

/** XLSX (OOXML) começa com PK (ZIP). XLS (Excel 97-2003) começa com assinatura OLE. */
function detectSpreadsheetFromBytes(bytes: Uint8Array): { mime: string; fileName: string } | null {
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return {
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: "Analise_Turya_XLSX.xlsx",
    };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  ) {
    return {
      mime: "application/vnd.ms-excel",
      fileName: "Analise_Turya_XLSX.xls",
    };
  }
  return null;
}

function normalizeBase64Payload(value: string): string {
  let s = value.trim().replace(/\s/g, "");
  if (s.startsWith("data:")) {
    const i = s.indexOf("base64,");
    if (i !== -1) s = s.slice(i + 7);
    else {
      const comma = s.indexOf(",");
      if (comma !== -1) s = s.slice(comma + 1);
    }
  }
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  return s;
}

function decodeSpreadsheetFromBase64String(
  value: string,
  preferredName: string
): { blob: Blob; fileName: string } | null {
  try {
    if (/^https?:\/\//i.test(value)) return null;
    const normalized = normalizeBase64Payload(value);
    const binaryString = atob(normalized);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const detected = detectSpreadsheetFromBytes(bytes);
    if (!detected) return null;
    const name =
      preferredName && preferredName !== "Analise_Turya_XLSX"
        ? preferredName
        : detected.fileName;
    return { blob: new Blob([bytes], { type: detected.mime }), fileName: name };
  } catch {
    return null;
  }
}

function findSpreadsheetInUnknownStrings(root: unknown): { blob: Blob; fileName: string } | null {
  const queue: unknown[] = [root];
  const visited = new Set<unknown>();
  const minLen = 200;

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === null || current === undefined) continue;
    if (typeof current === "string") {
      if (current.length < minLen) continue;
      const decoded = decodeSpreadsheetFromBase64String(current, "Analise_Turya_XLSX");
      if (decoded) return decoded;
      continue;
    }
    if (typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }
    for (const v of Object.values(current as Record<string, unknown>)) {
      queue.push(v);
    }
  }
  return null;
}

function getFirstString(
  obj: Record<string, unknown>,
  keys: string[],
  fallback: string
): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}
