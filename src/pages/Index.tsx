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
  const candidateKeys = [
    "Analise_Turya_XLSX",
    "analise_turya_xlsx",
    "xlsx_content",
    "excel_content",
    "excel_base64",
    "secondary_file_content",
    "arquivo_extra_content",
  ];

  for (const key of candidateKeys) {
    const value = data[key];
    if (typeof value !== "string" || !value.trim()) continue;
    try {
      const blob = base64ToBlob(value.trim(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return { blob, fileName: "Analise_Turya_XLSX" };
    } catch {
      // try next key
    }
  }

  return null;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const normalized = base64.startsWith("data:")
    ? base64.substring(base64.indexOf(",") + 1)
    : base64;
  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}
