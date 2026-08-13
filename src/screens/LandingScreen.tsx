import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import UploadZone from "@/components/UploadZone";
import TermsOfUseModal from "@/components/TermsOfUseModal";
import ErrorMessage from "@/components/ErrorMessage";
import BenefitsSection from "@/components/BenefitsSection";
import Footer from "@/components/Footer";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { useTermsGate } from "@/hooks/useTermsGate";

const LandingScreen = () => {
  const { appState } = useAnalysisFlow();
  const { handleOpenTermsFromFooter } = useTermsGate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TermsOfUseModal />

      <main>
        <HeroSection />

        {appState === "upload" && <UploadZone />}

        {appState === "error" && <ErrorMessage />}

        <BenefitsSection />
      </main>

      <Footer onOpenTerms={handleOpenTermsFromFooter} />
    </div>
  );
};

export default LandingScreen;
