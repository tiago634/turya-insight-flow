import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { CtaButton } from "@/components/CtaButton";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[#070410] text-white">
      <Header variant="brand" />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="eyebrow-turya mb-6">página não encontrada</div>
        <h1 className="text-[clamp(48px,10vw,96px)] font-extralight leading-none tracking-[-0.5px]">
          <span className="text-grad">404</span>
        </h1>
        <p className="mt-6 max-w-md text-[17px] font-light text-white/88">
          Este endereço não existe. Volte para a análise de cotações D&amp;O.
        </p>
        <div className="mt-10">
          <CtaButton href="/">VOLTAR AO INÍCIO</CtaButton>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
