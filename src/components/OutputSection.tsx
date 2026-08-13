import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

const ROWS = [
  { best: true, ok: true, label: "Cotação A · melhor opção", value: "recomendada" },
  { best: false, ok: false, label: "Cotação B · franquia divergente", value: "gap" },
  { best: false, ok: false, label: "Cotação C · exclusão relevante", value: "atenção" },
  { best: false, ok: true, label: "Coberturas comparadas", value: "cláusula a cláusula" },
  { best: false, ok: true, label: "Entrega", value: "relatório + planilha" },
];

const CIRC = 264;
const TARGET = 96;

const OutputSection = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          if (reduced) setPct(TARGET);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      setPct(Math.round(TARGET * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const offset = CIRC - (CIRC * pct) / 100;

  return (
    <section
      id="output"
      className="relative isolate flex flex-col items-center px-6 py-[84px] md:py-[130px]"
    >
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="grid items-center gap-10 text-center md:grid-cols-2 md:gap-14 md:text-left">
          <Reveal>
            <div className="eyebrow-turya mb-[26px]">o que você recebe</div>
            <h2 className="text-[clamp(26px,3.8vw,42px)] font-extralight leading-[1.25] tracking-[-0.5px]">
              Gaps marcados, coberturas normalizadas e{" "}
              <span className="text-grad">recomendação consultiva</span>.
            </h2>
            <p className="mx-auto mt-[26px] max-w-[560px] text-[clamp(16px,2vw,19px)] font-light text-white/88 md:mx-0">
              A IA lê cada cotação, normaliza coberturas entre seguradoras, evidencia franquias
              divergentes e exclusões relevantes — e organiza tudo em um comparativo pronto para
              sustentar a sua recomendação ao cliente.
            </p>
            <span className="mt-[22px] inline-block rounded-full border border-[rgba(255,180,110,.3)] px-4 py-1.5 text-xs tracking-widest text-turya-gold">
              relatório para o cliente + planilha de apoio
            </span>
          </Reveal>

          <Reveal>
            <div
              ref={panelRef}
              className="relative rounded-[22px] border border-[rgba(255,180,110,.16)] bg-gradient-to-b from-[rgba(24,16,34,.85)] to-[rgba(12,8,20,.85)] p-6 shadow-[0_30px_80px_rgba(0,0,0,.5),0_0_50px_rgba(234,100,36,.08)]"
              aria-hidden
            >
              <div className="mb-[18px] flex items-center justify-between">
                <span className="text-[11px] tracking-[2px] text-white/68">
                  TURYA · COMPARATIVO D&amp;O
                </span>
                <span className="flex gap-1.5">
                  <i className="block h-2 w-2 rounded-full bg-[rgba(234,100,36,.7)]" />
                  <i className="block h-2 w-2 rounded-full bg-white/18" />
                  <i className="block h-2 w-2 rounded-full bg-white/18" />
                </span>
              </div>
              <div className="grid items-center gap-[18px] md:grid-cols-[1fr_96px]">
                <div className="flex flex-col gap-2.5">
                  {ROWS.map((row, i) => (
                    <div
                      key={row.label}
                      className={cn(
                        "flex items-center gap-[11px] rounded-[11px] border px-[13px] py-[11px] transition-[opacity,transform] duration-500",
                        row.best
                          ? "border-[rgba(255,200,120,.65)] bg-[rgba(234,100,36,.1)]"
                          : "border-[rgba(255,200,130,.14)] bg-white/[.04]",
                        inView ? "translate-x-0 opacity-100" : "translate-x-3.5 opacity-0"
                      )}
                      style={{ transitionDelay: inView ? `${i * 120}ms` : "0ms" }}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          row.ok
                            ? "bg-[#7CD992] shadow-[0_0_10px_rgba(124,217,146,.6)]"
                            : "animate-turya-gap bg-[#EA6424]"
                        )}
                      />
                      <span className="flex-1 text-[12.5px] text-white/88">{row.label}</span>
                      <span className="text-[11px] tracking-[0.4px] text-white/68">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="relative mx-auto h-24 w-24">
                  <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="rgba(255,255,255,.08)"
                      strokeWidth="7"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="url(#rg)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset={offset}
                    />
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#FFDE59" />
                        <stop offset="1" stopColor="#EA6424" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <b className="text-grad text-[22px] font-extrabold">−{pct}%</b>
                    <span className="text-[9px] tracking-[1.5px] text-white/68">TEMPO</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-[rgba(255,180,110,.16)] pt-3.5 text-[11.5px] text-white/68">
                Exemplo ilustrativo do comparativo gerado pela Turya, com revisão humana no comando.
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default OutputSection;
