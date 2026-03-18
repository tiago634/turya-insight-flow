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

  const checkAnalysisStatus = async (sessionId: string) => {
    try {
      // Query param evita cache do navegador (304) e garante resposta sempre atual
      const url = `${STATUS_CHECK_URL}/api/analysis/${sessionId}?t=${Date.now()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ao verificar status: ${response.status}`);
      }

      const text = await response.text();
      let data: { status?: string; html_content?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("Polling: resposta não é JSON válido. Tamanho:", text.length, parseErr);
        return;
      }

      const hasHtml = !!(data.html_content && data.html_content.length > 0);
      const isCompleted = data.status === "completed" || (hasHtml && data.status !== "error");
      if (isCompleted && hasHtml) {
        try {
          const binaryString = atob(data.html_content!);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "text/html" });
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setHtmlBlob(blob);
          setAppState("completed");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (blobErr) {
          console.error("Polling: erro ao converter html_content para blob", blobErr);
        }
        return;
      }

      if (data.status === "error") {
        // Parar polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setErrorMessage(data.error || "Erro ao processar análise");
        setAppState("error");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (data.status === "processing" && !hasHtml) {
        console.log("Polling:", data.status, "| backend:", STATUS_CHECK_URL);
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
    return <DownloadReport htmlBlob={htmlBlob} onReset={handleReset} />;
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

      <Footer />
    </div>
  );
};

export default Index;
