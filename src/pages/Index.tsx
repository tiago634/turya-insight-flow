import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import UploadZone from "@/components/UploadZone";
import LoadingAnalysis from "@/components/LoadingAnalysis";
import DownloadReport from "@/components/DownloadReport";
import TermsOfUseModal from "@/components/TermsOfUseModal";
import ErrorMessage from "@/components/ErrorMessage";
import BenefitsSection from "@/components/BenefitsSection";
import Footer from "@/components/Footer";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { useTermsGate } from "@/hooks/useTermsGate";
import { STATUS_CHECK_URL } from "@/lib/turya/config";

const Index = () => {
  const {
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
  } = useAnalysisFlow();

  const {
    termsAccepted,
    termsOpen,
    requestTermsAcceptance,
    handleAcceptTerms,
    handleCancelTerms,
    handleOpenTermsFromFooter,
  } = useTermsGate();

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
        docxBlob={docxBlob}
        docxFileName={docxFileName}
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
