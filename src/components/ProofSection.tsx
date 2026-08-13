import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";

const ProofSection = () => {
  const barsRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="prova"
      className="relative isolate flex flex-col items-center justify-center bg-[radial-gradient(120%_90%_at_50%_50%,#160d22_0%,#070410_70%)] px-6 py-[84px] text-center md:px-6 md:py-[130px]"
    >
      <div className="mx-auto w-full max-w-[1040px]">
        <Reveal>
          <div className="eyebrow-turya mb-[26px]">o resultado medido</div>
          <h2 className="text-[clamp(26px,3.8vw,42px)] font-extralight leading-[1.25] tracking-[-0.5px]">
            O que levava uma tarde inteira,
            <br />
            agora <span className="text-grad">cabe num café</span>.
          </h2>
          <p className="mx-auto mt-[26px] max-w-[720px] text-[clamp(16px,2vw,19px)] font-light text-white/88">
            Corretores perdem em média 4 horas por análise D&amp;O comparando manualmente
            cláusula por cláusula. A Turya elimina esse gargalo sem abrir mão do rigor técnico.
          </p>
          <span className="text-grad mt-11 inline-block text-[clamp(64px,11vw,120px)] leading-none">
            −96%
          </span>
          <span className="mt-4 block text-[11px] tracking-[2px] text-white/68">
            de redução no tempo por análise comparativa¹
          </span>
        </Reveal>

        <Reveal className="mx-auto mt-12 grid w-full max-w-[860px] grid-cols-1 gap-[22px] text-left md:grid-cols-2">
          <div className="rounded-[18px] border border-[rgba(150,165,190,.18)] bg-[rgba(18,12,28,.4)] px-7 py-[30px]">
            <span className="mb-3 block text-[11px] tracking-[2px] text-white/68">hoje</span>
            <h3 className="mb-2.5 text-[19px] font-normal text-white">A análise ainda é manual</h3>
            <p className="text-sm text-white/88">
              Uma comparação de cotações D&amp;O consome de 3 a 8 horas de trabalho técnico: ler
              cada PDF, montar planilha, conferir cláusula por cláusula.
            </p>
          </div>
          <div className="rounded-[18px] border border-[rgba(255,180,110,.55)] bg-[rgba(234,100,36,.1)] px-7 py-[30px] shadow-[0_0_34px_rgba(234,100,36,.18)]">
            <span className="mb-3 block text-[11px] tracking-[2px] text-turya-gold">com a turya</span>
            <h3 className="mb-2.5 text-[19px] font-normal text-white">O comparativo chega pronto</h3>
            <p className="text-sm text-white/88">
              O mesmo resultado em menos de 5 minutos: relatório profissional para o cliente e
              planilha de apoio para o corretor.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div ref={barsRef} className="mx-auto mt-12 w-full max-w-[860px] text-left">
            <div className="mb-7">
              <div className="mb-2.5 flex items-baseline justify-between">
                <span className="text-[11px] tracking-[2px] text-white/68">processo manual</span>
                <span className="text-xl font-normal">3–8h</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/[.06]">
                <div
                  className="h-full rounded-full bg-[rgba(150,165,190,.4)] transition-[width] duration-[900ms] ease-out"
                  style={{ width: armed ? "100%" : "0%" }}
                />
              </div>
            </div>
            <div className="mb-7">
              <div className="mb-2.5 flex items-baseline justify-between">
                <span className="text-[11px] tracking-[2px] text-white/68">com a turya</span>
                <span className="text-grad text-xl">&lt; 5 min</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/[.06]">
                <div
                  className="h-full min-w-[6px] rounded-full transition-[width] duration-[900ms] ease-out"
                  style={{
                    width: armed ? "1.5%" : "0%",
                    background: "linear-gradient(90deg,#FFDE59 0%,#EA6424 58%,#FFC6A4 100%)",
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between border-t border-white/[.06] pt-2">
              {["0h", "2h", "4h", "6h", "8h"].map((label) => (
                <span key={label} className="text-[10px] tracking-widest text-white/45">
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-[18px] max-w-[560px] text-left text-[12.5px] tracking-[0.4px] text-white/68">
              ¹ Comparação entre o tempo médio de uma análise comparativa manual (3–8 horas de
              trabalho técnico) e o processamento da Turya (menos de 5 minutos por lote de até 10
              cotações).
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ProofSection;
