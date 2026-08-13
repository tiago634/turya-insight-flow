import LoadingAnalysis from "@/components/LoadingAnalysis";
import DownloadReport from "@/components/DownloadReport";
import LandingScreen from "@/screens/LandingScreen";
import { AnalysisFlowProvider, useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { TermsGateProvider } from "@/hooks/useTermsGate";

const AppScreens = () => {
  const { appState, sessionId } = useAnalysisFlow();

  if (appState === "processing" && sessionId) {
    return <LoadingAnalysis />;
  }

  if (appState === "completed") {
    return <DownloadReport />;
  }

  return <LandingScreen />;
};

const Index = () => (
  <AnalysisFlowProvider>
    <TermsGateProvider>
      <AppScreens />
    </TermsGateProvider>
  </AnalysisFlowProvider>
);

export default Index;
