import { CtaButton, scrollToUpload } from "@/components/CtaButton";
import { HeroCanvas } from "@/components/HeroCanvas";

const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative isolate flex h-screen min-h-[580px] flex-col items-center justify-center overflow-hidden px-6 text-center md:min-h-[640px]"
    >
      <HeroCanvas />

      <div className="hero-c pointer-events-none relative z-[2] max-w-[900px] px-6">
        <div className="eyebrow-turya mb-[26px]">análise inteligente de cotações d&amp;o</div>
        <h1 className="text-[clamp(30px,5.4vw,58px)] font-extralight leading-[1.25] tracking-[-0.5px]">
          O comparativo que levava horas,
          <br />
          <span className="text-grad">pronto em minutos.</span>
        </h1>
        <p className="mx-auto mt-[26px] max-w-[680px] text-[clamp(16px,2vw,19px)] font-light text-white/88">
          Envie os PDFs das cotações D&amp;O e receba um comparativo completo de coberturas,
          franquias e prêmios — cláusula por cláusula, pronto para apresentar ao seu cliente.
        </p>
        <div className="pointer-events-auto mt-[34px] flex justify-center">
          <CtaButton href="#upload" onClick={scrollToUpload}>
            ANALISAR COTAÇÕES AGORA
          </CtaButton>
        </div>
        <p className="mx-auto mt-4 max-w-[480px] text-[12.5px] tracking-[0.4px] text-white/68">
          Até 10 cotações por envio · relatório + planilha em menos de 5 minutos.
        </p>
      </div>

      <div
        id="hero-hint"
        className="absolute bottom-16 left-0 right-0 z-[2] animate-turya-hint text-center text-[13px] tracking-[2px] text-white/68 transition-opacity duration-700"
      >
        mova o cursor · acenda o que está no escuro
      </div>
      <div className="scrollcue" aria-hidden />
    </section>
  );
};

export default HeroSection;
