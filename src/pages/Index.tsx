import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import UploadZone from "@/components/UploadZone";
import LoadingAnalysis from "@/components/LoadingAnalysis";
import DownloadReport from "@/components/DownloadReport";
import ErrorMessage from "@/components/ErrorMessage";
import BenefitsSection from "@/components/BenefitsSection";
import Footer from "@/components/Footer";

type AppState = "upload" | "processing" | "completed" | "error";

const POLLING_INTERVAL = 3000; // 3 segundos
const MAX_POLLING_TIME = 10 * 60 * 1000; // 10 minutos
// URL do servidor local para verificar status
const STATUS_CHECK_URL = import.meta.env.VITE_WEBHOOK_SERVER_URL || "http://localhost:3001";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("upload");
  const [htmlBlob, setHtmlBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);

  const checkAnalysisStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`${STATUS_CHECK_URL}/api/analysis/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao verificar status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "completed" && data.html_content) {
        // Converter base64 para blob
        const binaryString = atob(data.html_content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "text/html" });
        
        // Parar polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setHtmlBlob(blob);
        setAppState("completed");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (data.status === "error") {
        // Parar polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setErrorMessage(data.error || "Erro ao processar análise");
        setAppState("error");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      // Se status === "processing", continuar polling
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      // Não parar o polling em caso de erro de rede, apenas logar
    }
  };

  useEffect(() => {
    // Iniciar polling quando sessionId for definido e estiver em processing
    if (appState === "processing" && sessionId) {
      pollingStartTimeRef.current = Date.now();
      
      // Verificar imediatamente
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <HeroSection />

        {appState === "upload" && (
          <UploadZone 
            onSuccess={handleSuccess}
            onError={handleError}
            onStartProcessing={handleStartProcessing}
            sessionId={sessionId}
          />
        )}

        {appState === "processing" && sessionId && (
          <LoadingAnalysis sessionId={sessionId} />
        )}

        {appState === "completed" && htmlBlob && (
          <DownloadReport htmlBlob={htmlBlob} onReset={handleReset} />
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
