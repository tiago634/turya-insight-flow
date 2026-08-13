import { AlertTriangle, RotateCcw } from "lucide-react";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";

const ErrorMessage = () => {
  const { errorMessage: message, handleReset: onRetry } = useAnalysisFlow();
  return (
    <section
      id="upload"
      className="relative isolate flex flex-col items-center px-6 py-[84px] text-center md:py-[130px]"
    >
      <div className="mx-auto w-full max-w-[760px] rounded-[22px] border border-[rgba(255,180,110,.16)] bg-[rgba(18,12,28,.5)] px-8 py-12 shadow-[0_30px_80px_rgba(0,0,0,.5),0_0_50px_rgba(234,100,36,.08)] md:px-12">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(234,100,36,.15)]">
          <AlertTriangle className="h-10 w-10 text-turya-orange" />
        </div>
        <div className="eyebrow-turya mb-4">algo deu errado</div>
        <h3 className="mb-4 text-[clamp(24px,3vw,32px)] font-extralight tracking-[-0.5px]">
          Não foi possível <span className="text-grad">concluir</span>
        </h3>
        <p className="mx-auto mb-8 max-w-md text-[15px] font-light text-white/88">{message}</p>
        <button type="button" onClick={onRetry} className="btn-solid !mt-0 max-w-xs">
          <RotateCcw className="h-4 w-4" />
          Tentar Novamente
        </button>
      </div>
    </section>
  );
};

export default ErrorMessage;
