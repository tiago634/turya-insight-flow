import { Reveal } from "@/components/Reveal";
import { scrollToUpload } from "@/components/CtaButton";

const STEPS = [
  {
    n: "01",
    title: "Envie",
    text: "Faça upload dos PDFs recebidos das seguradoras — até 10 cotações de uma vez, direto do computador ou do celular.",
  },
  {
    n: "02",
    title: "Compare",
    text: "A IA lê coberturas, franquias, prêmios e exclusões e confronta tudo com critério técnico consistente, sem variação entre análises.",
  },
  {
    n: "03",
    title: "Apresente",
    text: "Em menos de 5 minutos: relatório profissional pronto para o cliente e planilha de apoio para o seu trabalho.",
  },
];

const HowItWorksSection = () => {
  return (
    <section
      id="como-funciona"
      className="relative isolate flex flex-col items-center px-6 py-[84px] text-center md:py-[130px]"
    >
      <div className="mx-auto w-full max-w-[1040px]">
        <Reveal>
          <div className="eyebrow-turya mb-[26px]">como funciona</div>
          <h2 className="text-[clamp(26px,3.8vw,42px)] font-extralight leading-[1.25] tracking-[-0.5px]">
            Três passos entre o PDF da seguradora
            <br />e o <span className="text-grad">relatório no seu cliente</span>.
          </h2>
        </Reveal>

        <Reveal className="mt-12 grid w-full grid-cols-1 gap-4 text-left md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-[rgba(150,165,190,.18)] bg-[rgba(18,12,28,.4)] px-[22px] py-6 transition-all duration-[400ms] hover:border-[rgba(255,180,110,.5)] hover:bg-[rgba(234,100,36,.07)]"
            >
              <div className="mb-2.5 flex items-baseline justify-between">
                <h3 className="text-[17px] font-extrabold text-turya-gold">{step.title}</h3>
                <span className="text-[11px] tracking-[2px] text-white/68">{step.n}</span>
              </div>
              <p className="text-[13.5px] text-white/88">{step.text}</p>
            </div>
          ))}
        </Reveal>

        <Reveal>
          <a
            href="#upload"
            onClick={scrollToUpload}
            className="mt-10 inline-block text-[13px] tracking-widest text-turya-gold no-underline transition-colors hover:text-white"
          >
            enviar minhas cotações →
          </a>
        </Reveal>
      </div>
    </section>
  );
};

export default HowItWorksSection;
