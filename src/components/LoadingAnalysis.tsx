import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";

const CLAUSES = [
  "Cláusula 3.1: Cobertura Principal",
  "Cláusula 4.2: Limite de Responsabilidade",
  "Cláusula 5.0: Franquia Mínima",
  "Cláusula 6.3: Exclusões Específicas",
  "Cláusula 7.1: Retroatividade",
  "Cláusula 8.4: Condições Especiais",
];

const LoadingAnalysis = () => {
  const { sessionId } = useAnalysisFlow();
  const [clauseIndex, setClauseIndex] = useState(0);
  const [clauseVisible, setClauseVisible] = useState(true);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setClauseVisible(false);
      timeoutId = setTimeout(() => {
        setClauseIndex((i) => (i + 1) % CLAUSES.length);
        setClauseVisible(true);
      }, 320);
    }, 3800);
    return () => {
      clearInterval(id);
      clearTimeout(timeoutId!);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSecs((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timerStr = `${Math.floor(elapsedSecs / 60)}:${String(elapsedSecs % 60).padStart(2, "0")}`;

  return (
      <div className="relative min-h-screen overflow-hidden bg-[#070410] text-white" data-session={sessionId ?? ""}>
      <Header variant="brand" />

      <div className="mx-auto grid min-h-screen max-w-[1180px] items-center gap-12 px-6 pb-16 pt-28 md:grid-cols-2 md:gap-16 md:px-10">
        <div>
          <div className="eyebrow-turya mb-6">análise d&amp;o em andamento</div>
          <h1 className="text-[clamp(32px,5vw,52px)] font-extralight leading-[1.2] tracking-[-0.5px]">
            Lendo cada
            <br />
            <span className="text-grad">cláusula com</span>
            <br />
            atenção.
          </h1>
          <p className="mt-6 max-w-md text-[16px] font-light text-white/88">
            Seus documentos estão sendo revisados em profundidade: coberturas, franquias,
            sublimites e condições especiais.
          </p>
          <div className="mt-10 max-w-md">
            <div className="relative h-[2px] overflow-hidden rounded-full bg-white/[.08]">
              <div className="absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-gradient-to-r from-[#FFDE59] to-[#EA6424]" />
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] tracking-widest text-white/68">
              <span>
                Processando
                <span className="ml-0.5 inline-block animate-pulse">…</span>
              </span>
              <span className="font-mono tabular-nums text-turya-gold">{timerStr}</span>
            </div>
          </div>
        </div>

        <div
          className="relative rounded-[22px] border border-[rgba(255,180,110,.16)] bg-gradient-to-b from-[rgba(24,16,34,.85)] to-[rgba(12,8,20,.85)] p-6 shadow-[0_30px_80px_rgba(0,0,0,.5),0_0_50px_rgba(234,100,36,.08)]"
          aria-hidden
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] tracking-[2px] text-white/68">Documento em análise</div>
              <div className="mt-1 text-lg font-extrabold text-turya-gold">D&amp;O</div>
            </div>
            <span className="rounded-full border border-[rgba(255,180,110,.3)] px-3 py-1 text-[11px] tracking-widest text-turya-gold">
              Lendo
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="h-1.5 w-full rounded-full bg-[rgba(234,100,36,.45)]" />
            <div className="h-1.5 w-[90%] rounded-full bg-[rgba(234,100,36,.35)]" />
            <div className="h-1.5 w-[80%] rounded-full bg-[rgba(234,100,36,.28)]" />
            <div className="h-1.5 w-[65%] rounded-full bg-[rgba(234,100,36,.2)]" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-[rgba(255,222,89,.45)]" />
            <div className="h-1.5 w-[80%] rounded-full bg-white/[.08]" />
            <div className="h-1.5 w-[45%] rounded-full bg-white/[.06]" />
          </div>
          <div className="mt-6 rounded-xl border border-[rgba(255,180,110,.16)] bg-white/[.03] p-4">
            <div
              className="text-[12.5px] text-turya-gold transition-opacity duration-300"
              style={{ opacity: clauseVisible ? 1 : 0 }}
            >
              {CLAUSES[clauseIndex]}
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-1 w-[95%] rounded-full bg-white/10" />
              <div className="h-1 w-[80%] rounded-full bg-white/10" />
              <div className="h-1 w-[60%] rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnalysis;
