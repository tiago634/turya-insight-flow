import { Reveal } from "@/components/Reveal";

const CAPS = [
  {
    title: "De horas para minutos",
    text: "Uma comparação manual de cotações D&O consome de 3 a 8 horas de trabalho técnico. A Turya entrega o mesmo resultado em menos de 5 minutos.",
  },
  {
    title: "Rigor cláusula por cláusula",
    text: "A IA lê coberturas, franquias, prêmios e exclusões de cada cotação e organiza as evidências para uma comparação clara — nenhuma cláusula passa despercebida, nem as que prejudicam o segurado.",
  },
  {
    title: "Relatório pronto para o cliente",
    text: "O comparativo gerado é visualmente profissional e pode ser entregue diretamente ao cliente final — um material que a concorrência não produz na mesma velocidade.",
  },
  {
    title: "Análise padronizada, sempre",
    text: "Toda análise segue o mesmo critério técnico, independente de quem fez o upload. Sem variação de qualidade entre analistas, sem interpretações divergentes.",
  },
  {
    title: "Escala sem aumentar a equipe",
    text: "Um corretor sozinho processa o volume de análises que antes exigia uma equipe técnica dedicada — sem contratar, sem terceirizar.",
  },
  {
    title: "Feita para o mercado brasileiro",
    text: "A IA conhece as particularidades do D&O nacional: limitações das seguradoras locais, estruturas de franquia e padrões de cobertura do mercado brasileiro.",
  },
];

const BenefitsSection = () => {
  return (
    <section
      id="beneficios"
      className="relative isolate flex flex-col items-center px-6 py-[84px] text-center md:py-[130px]"
    >
      <div className="mx-auto w-full max-w-[1040px]">
        <Reveal>
          <div className="eyebrow-turya mb-[26px]">por que usar a turya</div>
          <h2 className="text-[clamp(26px,3.8vw,42px)] font-extralight leading-[1.25] tracking-[-0.5px]">
            Compita por valor,
            <br />
            não <span className="text-grad">apenas por preço</span>.
          </h2>
          <p className="mx-auto mt-[26px] max-w-[720px] text-[clamp(16px,2vw,19px)] font-light text-white/88">
            O corretor que apresenta um comparativo técnico profissional deixa de vender apenas
            acesso ao mercado e passa a vender inteligência de risco.
          </p>
        </Reveal>

        <Reveal className="mt-12 grid w-full grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
          {CAPS.map((cap) => (
            <div
              key={cap.title}
              className="rounded-[18px] border border-[rgba(255,180,110,.16)] bg-[rgba(18,12,28,.5)] px-[26px] py-7 transition-all duration-[400ms] hover:-translate-y-1 hover:border-[rgba(255,200,120,.6)] hover:shadow-[0_0_34px_rgba(234,100,36,.2)]"
            >
              <h3 className="mb-3 text-[17px] font-extrabold text-white">{cap.title}</h3>
              <p className="text-sm text-white/88">{cap.text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default BenefitsSection;
