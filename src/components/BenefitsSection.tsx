import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Zap, BarChart3, Brain } from "lucide-react";

const getIcon = (type: "zap" | "chart" | "brain") => {
  switch (type) {
    case "zap":
      return Zap;
    case "chart":
      return BarChart3;
    case "brain":
      return Brain;
  }
};

const benefits = [
  {
    iconType: "zap" as const,
    title: "De dias para minutos",
    description:
      "Uma comparação manual de cotações D&O consome entre 3 e 8 horas de trabalho técnico. A Turya entrega o mesmo resultado em menos de 5 minutos.",
    footer: {
      kind: "single",
      text: "-96% menos tempo por análise comparativa",
    },
  },
  {
    iconType: "chart" as const,
    title: "Rigor cláusula por cláusula",
    description:
      "A IA lê coberturas, sublimites, franquias, retroatividade de exclusões específicas de cada seguradora e formaliza tudo em taxonomia padronizada para comparação real.",
    footer: {
      kind: "highlight",
      text: "Nenhuma cláusula passa despercebida, nem as que prejudicam o seguro",
    },
  },
  {
    iconType: "brain" as const,
    title: "Relatório pronto para o cliente",
    description:
      "O relatório HTML gerado é visualmente profissional e permite entrega ao cliente algo que nenhum concorrente consegue produzir na mesma velocidade.",
    footer: {
      kind: "dual",
      top: "Diferencial competitivo",
      bottom: "visível para o cliente final",
    },
  },
  {
    iconType: "zap" as const,
    title: "Análise padronizada, sempre",
    description:
      "Toda análise gerada segue o mesmo critério técnico, independente de quem fez o upload. Sem variação de qualidade entre analistas, sem interpretações divergentes entre atendimentos.",
  },
  {
    iconType: "chart" as const,
    title: "Escala sem aumentar equipe",
    description:
      "Com a Turya, um corretor sozinho consegue processar o volume de análises que antes exigia uma equipe técnica dedicada, sem contratar, sem terceirizar.",
  },
  {
    iconType: "brain" as const,
    title: "Treinado para o mercado brasileiro",
    description:
      "A IA conhece as particularidades do D&O brasileiro, determina limitações das seguradoras locais, estruturas de franquia, regionais e os padrões de cobertura do mercado nacional.",
  },
];

type Footer =
  | { kind: "single"; text: string }
  | { kind: "highlight"; text: string }
  | { kind: "dual"; top: string; bottom: string };

const BenefitsSection = () => {
  const timerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRunTimer, setShouldRunTimer] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0); // tempo real desde que o card entrou na tela

  const TURYA_TOTAL_MS = 5 * 60 * 1000;
  const MANUAL_TOTAL_MS = 4 * 60 * 60 * 1000;

  useEffect(() => {
    const el = timerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const isInView = entries.some((e) => e.isIntersecting);
        if (!isInView) return;

        // Respeita acessibilidade: se o usuário preferir menos animações, mantém estático.
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (!reduced) setShouldRunTimer(true);

        io.disconnect();
      },
      { threshold: 0.35 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldRunTimer) return;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(MANUAL_TOTAL_MS, now - start);
      setElapsedMs(elapsed);

      if (elapsed < MANUAL_TOTAL_MS) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shouldRunTimer]);

  const turyaRemainingMs = Math.max(0, TURYA_TOTAL_MS - elapsedMs);
  const manualRemainingMs = Math.max(0, MANUAL_TOTAL_MS - elapsedMs);

  const turyaProgress = Math.min(1, elapsedMs / TURYA_TOTAL_MS);
  const manualProgress = Math.min(1, elapsedMs / MANUAL_TOTAL_MS);

  return (
    <section id="beneficios" className="py-24 relative">
      <div className="absolute inset-0 bg-radial-glow opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="text-gradient-warm text-sm font-semibold uppercase tracking-[0.18em] mb-4">
            POR QUE USAR A TURYA?
          </div>

          <h2 className="text-4xl md:text-5xl font-bold leading-[1.05] mb-5">
            O que levava dias, agora leva{" "}
            <span className="text-gradient-warm">minutos</span>.
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg">
            Corretores perdem em média 4 horas por cotação D&amp;O comparando
            manualmente cláusula por cláusula. A Turya elimina esse gargalo, sem
            perder rigor técnico.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {benefits.map((benefit, index) => {
            const Icon = getIcon(benefit.iconType);
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="card-elevated p-8 h-full transition-all hover:border-primary/40">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Icon className="w-8 h-8 text-foreground" />
                  </motion.div>

                  <h3 className="text-xl font-bold mb-3 leading-tight">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>

                  {"footer" in benefit && benefit.footer ? (
                    <div className="mt-6">
                      {renderFooter(benefit.footer as Footer)}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-elevated p-10 md:p-12 flex flex-col md:flex-row gap-10 items-start md:items-center justify-between"
        >
          <div className="max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
              O corretor que usa a{" "}
              <span className="text-gradient-warm">Turya</span> fecha mais, em{" "}
              <span className="text-gradient-warm">menos tempo</span>.
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Enquanto a concorrência ainda está montando planilhas, você já está
              apresentando o relatório, e ganhando a confiança do cliente com
              profissionalismo que eles nunca viram antes.
            </p>
          </div>

          <div className="w-full md:w-[320px] rounded-2xl border border-border/50 bg-background/40 px-10 py-7 text-center">
            <div ref={timerRef} className="w-full">
              <div className="text-[11px] md:text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em] whitespace-nowrap">
                Comparativo de tempo (1 análise)
              </div>

              <div className="mt-3 flex items-center justify-between gap-6 w-full">
                <div className="flex-[1.3]">
                  <div className="text-xs font-semibold text-muted-foreground text-center">
                    Manual
                  </div>
                  <div className="text-3xl font-bold text-gradient-warm leading-tight mt-1 whitespace-nowrap tabular-nums text-center">
                    {formatHHMM(manualRemainingMs)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 text-center">
                    restante estimado
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-xs font-semibold text-muted-foreground text-center">
                    Turya
                  </div>
                  <div className="text-3xl font-bold text-gradient-warm leading-tight mt-1 whitespace-nowrap tabular-nums text-center">
                    {formatMMSS(turyaRemainingMs)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 text-center">
                    para concluir
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Manual (4h reais)</span>
                      <span className="font-semibold">
                        {Math.round(manualProgress * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-border/40 overflow-hidden mx-auto">
                      <motion.div
                        className="h-full bg-gradient-primary"
                        style={{ width: `${manualProgress * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Turya (5min reais)</span>
                      <span className="font-semibold">
                        {Math.round(turyaProgress * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-border/40 overflow-hidden mx-auto">
                      <motion.div
                        className="h-full bg-gradient-primary"
                        style={{ width: `${turyaProgress * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
                Economia estimada (1 análise):{" "}
                <span className="text-gradient-warm font-semibold whitespace-nowrap">
                  até 3h55m
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;

function renderFooter(footer: Footer) {
  if (footer.kind === "single") {
    return (
      <div className="rounded-xl border border-border/50 bg-background/30 px-4 py-3 text-sm text-muted-foreground">
        <span className="text-gradient-warm font-bold">{footer.text}</span>
      </div>
    );
  }

  if (footer.kind === "highlight") {
    return (
      <div className="rounded-xl border border-border/50 bg-background/30 px-4 py-3 text-sm leading-relaxed">
        <span className="text-muted-foreground">{footer.text}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-background/30 px-4 py-4 text-sm text-left">
      <div className="text-muted-foreground">{footer.top}</div>
      <div className="text-gradient-warm font-bold mt-1">{footer.bottom}</div>
    </div>
  );
}

function formatHHMM(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

function formatMMSS(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
