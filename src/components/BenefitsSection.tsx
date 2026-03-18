import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import bentoStyles from "./BentoBenefitsGrid.module.css";

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
            Corretores perdem em média 4 horas por análise D&amp;O comparando
            manualmente cláusula por cláusula. A Turya elimina esse gargalo, sem
            perder rigor técnico.
          </p>
        </motion.div>

        <div className={`${bentoStyles.bento} mb-12`}>
          {/* C1 — Velocidade */}
          <motion.div
            className={`${bentoStyles.card} ${bentoStyles.c1}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            <div className={bentoStyles.c1Grid} aria-hidden />

            <div className={bentoStyles.iconWrap} aria-hidden>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle
                  cx="26"
                  cy="28"
                  r="18"
                  stroke="rgba(234,100,36,0.25)"
                  strokeWidth="0.75"
                  strokeDasharray="2 3"
                  className="bp-stroke"
                />
                <circle
                  cx="26"
                  cy="28"
                  r="14"
                  stroke="rgba(234,100,36,0.6)"
                  strokeWidth="1"
                  className="bp-stroke"
                />
                <line
                  x1="26"
                  y1="14.5"
                  x2="26"
                  y2="16.5"
                  stroke="rgba(234,100,36,0.5)"
                  strokeWidth="1"
                  className="bp-stroke"
                />
                <line
                  x1="26"
                  y1="39.5"
                  x2="26"
                  y2="41.5"
                  stroke="rgba(234,100,36,0.5)"
                  strokeWidth="1"
                  className="bp-stroke"
                />
                <line
                  x1="12.5"
                  y1="28"
                  x2="14.5"
                  y2="28"
                  stroke="rgba(234,100,36,0.5)"
                  strokeWidth="1"
                  className="bp-stroke"
                />
                <line
                  x1="37.5"
                  y1="28"
                  x2="39.5"
                  y2="28"
                  stroke="rgba(234,100,36,0.5)"
                  strokeWidth="1"
                  className="bp-stroke"
                />
                <line
                  x1="26"
                  y1="28"
                  x2="26"
                  y2="18"
                  stroke="rgba(234,100,36,0.9)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="bp-accent"
                />
                <line
                  x1="26"
                  y1="28"
                  x2="32"
                  y2="22"
                  stroke="#EA6424"
                  strokeWidth="1"
                  strokeLinecap="round"
                  className="bp-accent"
                />
                <circle
                  cx="26"
                  cy="28"
                  r="1.5"
                  fill="rgba(234,100,36,0.8)"
                  className="bp-fill"
                />
                <line x1="26" y1="10" x2="26" y2="13" stroke="rgba(234,100,36,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="23" y1="8.5" x2="26" y2="10" stroke="rgba(234,100,36,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="29" y1="8.5" x2="26" y2="10" stroke="rgba(234,100,36,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="4" y1="4" x2="10" y2="4" stroke="rgba(234,100,36,0.2)" strokeWidth="0.75" />
                <line x1="4" y1="4" x2="4" y2="10" stroke="rgba(234,100,36,0.2)" strokeWidth="0.75" />
              </svg>
            </div>

            <div className={bentoStyles.bigMetric}>-96%</div>
            <div className={bentoStyles.bigMetricLabel}>tempo por análise comparativa</div>
            <div className={bentoStyles.cardTitle}>De dias para minutos</div>
            <div className={bentoStyles.cardText}>
              Uma comparação manual de cotações D&O consome entre 3-8 horas de trabalho técnico. A Turya entrega o mesmo resultado em menos de 5 minutos.
            </div>

            <div className={bentoStyles.statRow}>
              <div>
                <div className={bentoStyles.statNum}>3-8h</div>
                <div className={bentoStyles.statLbl}>processo manual</div>
              </div>
              <div className={bentoStyles.statDivider} aria-hidden />
              <div>
                <div className={bentoStyles.statNum}>&lt;5 min</div>
                <div className={bentoStyles.statLbl}>com a Turya</div>
              </div>
            </div>
          </motion.div>

          {/* C2 — Rigor cláusula */}
          <motion.div
            className={`${bentoStyles.card} ${bentoStyles.c2}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.13 }}
          >
            <div className={bentoStyles.iconWrap} aria-hidden>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect
                  x="10"
                  y="6"
                  width="24"
                  height="32"
                  rx="2"
                  stroke="rgba(234,100,36,0.55)"
                  strokeWidth="1"
                  className="bp-stroke"
                />
                <polyline
                  points="28,6 34,12 28,12"
                  stroke="rgba(234,100,36,0.4)"
                  strokeWidth="0.85"
                  fill="rgba(234,100,36,0.05)"
                  className="bp-stroke bp-fill"
                />
                <line x1="14" y1="19" x2="27" y2="19" stroke="rgba(234,100,36,0.35)" strokeWidth="0.85" className="bp-stroke" />
                <line x1="14" y1="23" x2="25" y2="23" stroke="rgba(234,100,36,0.25)" strokeWidth="0.85" className="bp-stroke" />
                <line x1="14" y1="27" x2="27" y2="27" stroke="rgba(234,100,36,0.35)" strokeWidth="0.85" className="bp-stroke" />
                <line x1="14" y1="31" x2="22" y2="31" stroke="rgba(234,100,36,0.25)" strokeWidth="0.85" className="bp-stroke" />
                <circle cx="36" cy="36" r="9" stroke="rgba(234,100,36,0.7)" strokeWidth="1" className="bp-stroke" />
                <circle cx="36" cy="36" r="5.5" stroke="rgba(234,100,36,0.35)" strokeWidth="0.75" strokeDasharray="1.5 2" className="bp-stroke" />
                <line x1="36" y1="31" x2="36" y2="33" stroke="rgba(234,100,36,0.5)" strokeWidth="0.75" className="bp-stroke" />
                <line x1="36" y1="39" x2="36" y2="41" stroke="rgba(234,100,36,0.5)" strokeWidth="0.75" className="bp-stroke" />
                <line x1="31" y1="36" x2="33" y2="36" stroke="rgba(234,100,36,0.5)" strokeWidth="0.75" className="bp-stroke" />
                <line x1="39" y1="36" x2="41" y2="36" stroke="rgba(234,100,36,0.5)" strokeWidth="0.75" className="bp-stroke" />
                <line x1="43" y1="43" x2="46" y2="46" stroke="#EA6424" strokeWidth="1.5" strokeLinecap="round" className="bp-accent" />
                <line x1="4" y1="4" x2="8" y2="4" stroke="rgba(234,100,36,0.15)" strokeWidth="0.75" />
                <line x1="4" y1="4" x2="4" y2="8" stroke="rgba(234,100,36,0.15)" strokeWidth="0.75" />
              </svg>
            </div>

            <div className={bentoStyles.cardTitle}>Rigor cláusula por cláusula</div>
            <div className={bentoStyles.cardText}>
              A IA lê coberturas, sublimites, franquias, retroatividade de exclusões específicas de cada seguradora e formaliza tudo em taxonomia padronizada para comparação real.
            </div>
            <div className={bentoStyles.quoteBox}>Nenhuma cláusula passa despercebida, nem as que prejudicam o seguro</div>
          </motion.div>

          {/* C3 — Relatório */}
          <motion.div
            className={`${bentoStyles.card} ${bentoStyles.c3}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.21 }}
          >
            <div className={bentoStyles.iconWrap} aria-hidden>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="8" width="36" height="26" rx="2" stroke="rgba(234,100,36,0.55)" strokeWidth="1" className="bp-stroke" />
                <rect x="9" y="11" width="30" height="20" rx="1" fill="rgba(234,100,36,0.04)" stroke="rgba(234,100,36,0.2)" strokeWidth="0.5" className="bp-fill bp-stroke" />
                <rect x="13" y="22" width="3.5" height="6" fill="rgba(234,100,36,0.25)" className="bp-fill" />
                <rect x="18.5" y="18" width="3.5" height="10" fill="rgba(234,100,36,0.45)" className="bp-fill" />
                <rect x="24" y="20" width="3.5" height="8" fill="rgba(234,100,36,0.3)" className="bp-fill" />
                <rect x="29.5" y="15" width="3.5" height="13" fill="rgba(234,100,36,0.7)" className="bp-fill" />
                <line x1="24" y1="34" x2="24" y2="40" stroke="rgba(234,100,36,0.35)" strokeWidth="1" className="bp-stroke" />
                <line x1="18" y1="40" x2="30" y2="40" stroke="rgba(234,100,36,0.35)" strokeWidth="1" className="bp-stroke" />
                <polyline points="36,6 42,6 42,12" stroke="rgba(234,100,36,0.5)" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round" className="bp-stroke" />
                <line x1="36" y1="12" x2="42" y2="6" stroke="#EA6424" strokeWidth="1" strokeLinecap="round" className="bp-accent" />
              </svg>
            </div>

            <div className={bentoStyles.cardTitle}>Relatório pronto para o cliente</div>
            <div className={bentoStyles.cardText}>
              O relatório HTML gerado é visualmente profissional e permite entrega ao cliente algo que nenhum concorrente consegue produzir na mesma velocidade.
            </div>
            <div className={bentoStyles.labelPair}>
              <div className={bentoStyles.lpTitle}>Diferencial competitivo</div>
              <div className={bentoStyles.lpValue}>visível para o cliente final</div>
            </div>
          </motion.div>

          {/* C4 — Padronizada */}
          <motion.div
            className={`${bentoStyles.card} ${bentoStyles.c4}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.29 }}
          >
            <div className={bentoStyles.iconWrap} aria-hidden>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="20" width="44" height="12" rx="1.5" stroke="rgba(234,100,36,0.55)" strokeWidth="1" className="bp-stroke" />
                <line x1="10" y1="20" x2="10" y2="26" stroke="rgba(234,100,36,0.6)" strokeWidth="0.85" />
                <line x1="16" y1="20" x2="16" y2="24" stroke="rgba(234,100,36,0.4)" strokeWidth="0.75" />
                <line x1="22" y1="20" x2="22" y2="26" stroke="rgba(234,100,36,0.6)" strokeWidth="0.85" />
                <line x1="28" y1="20" x2="28" y2="24" stroke="rgba(234,100,36,0.4)" strokeWidth="0.75" />
                <line x1="34" y1="20" x2="34" y2="26" stroke="rgba(234,100,36,0.6)" strokeWidth="0.85" />
                <line x1="40" y1="20" x2="40" y2="24" stroke="rgba(234,100,36,0.4)" strokeWidth="0.75" />
                <rect x="22" y="11" width="4" height="9" rx="0.5" stroke="rgba(234,100,36,0.7)" strokeWidth="0.85" fill="rgba(234,100,36,0.06)" className="bp-stroke bp-fill" />
                <rect x="22" y="32" width="4" height="9" rx="0.5" stroke="rgba(234,100,36,0.7)" strokeWidth="0.85" fill="rgba(234,100,36,0.06)" className="bp-stroke bp-fill" />
                <line x1="14" y1="15" x2="22" y2="15" stroke="rgba(234,100,36,0.4)" strokeWidth="0.75" />
                <line x1="34" y1="15" x2="26" y2="15" stroke="rgba(234,100,36,0.4)" strokeWidth="0.75" />
                <polyline points="14,13 14,17" stroke="rgba(234,100,36,0.4)" strokeWidth="0.75" />
                <polyline points="34,13 34,17" stroke="rgba(234,100,36,0.4)" strokeWidth="0.75" />
                <line x1="24" y1="11" x2="24" y2="41" stroke="#EA6424" strokeWidth="0.75" strokeDasharray="2 2" className="bp-accent" opacity="0.6" />
                <line x1="44" y1="4" x2="48" y2="4" stroke="rgba(234,100,36,0.15)" strokeWidth="0.75" />
                <line x1="48" y1="4" x2="48" y2="8" stroke="rgba(234,100,36,0.15)" strokeWidth="0.75" />
              </svg>
            </div>

            <div className={bentoStyles.cardTitle}>Análise padronizada, sempre</div>
            <div className={bentoStyles.cardText}>
              Toda análise gerada segue o mesmo critério técnico, independente de quem fez o upload. Sem variação de qualidade entre analistas, sem interpretações divergentes entre atendimentos.
            </div>
          </motion.div>

          {/* C5 — Escala */}
          <motion.div
            className={`${bentoStyles.card} ${bentoStyles.c5}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.37 }}
          >
            <div className={bentoStyles.iconWrap} aria-hidden>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="16" y1="26" x2="36" y2="14" stroke="rgba(234,100,36,0.3)" strokeWidth="0.85" strokeDasharray="2 2" className="bp-stroke" />
                <line x1="16" y1="26" x2="36" y2="26" stroke="rgba(234,100,36,0.3)" strokeWidth="0.85" strokeDasharray="2 2" className="bp-stroke" />
                <line x1="16" y1="26" x2="36" y2="38" stroke="rgba(234,100,36,0.3)" strokeWidth="0.85" strokeDasharray="2 2" className="bp-stroke" />
                <circle cx="38" cy="14" r="5" stroke="rgba(234,100,36,0.5)" strokeWidth="0.85" fill="rgba(234,100,36,0.06)" className="bp-stroke bp-fill" />
                <circle cx="38" cy="26" r="5" stroke="rgba(234,100,36,0.5)" strokeWidth="0.85" fill="rgba(234,100,36,0.06)" className="bp-stroke bp-fill" />
                <circle cx="38" cy="38" r="5" stroke="rgba(234,100,36,0.5)" strokeWidth="0.85" fill="rgba(234,100,36,0.06)" className="bp-stroke bp-fill" />
                <circle cx="38" cy="14" r="1.5" fill="rgba(234,100,36,0.5)" />
                <circle cx="38" cy="26" r="1.5" fill="rgba(234,100,36,0.5)" />
                <circle cx="38" cy="38" r="1.5" fill="rgba(234,100,36,0.5)" />
                <circle cx="16" cy="26" r="7" stroke="rgba(234,100,36,0.8)" strokeWidth="1" fill="rgba(234,100,36,0.08)" className="bp-stroke bp-fill" />
                <circle cx="16" cy="26" r="3.5" fill="#EA6424" opacity="0.7" className="bp-fill" />
                <circle cx="16" cy="26" r="11" stroke="rgba(234,100,36,0.12)" strokeWidth="0.75" strokeDasharray="3 4" className="bp-stroke" />
                <line x1="4" y1="48" x2="8" y2="48" stroke="rgba(234,100,36,0.15)" strokeWidth="0.75" />
                <line x1="4" y1="48" x2="4" y2="44" stroke="rgba(234,100,36,0.15)" strokeWidth="0.75" />
              </svg>
            </div>

            <div className={bentoStyles.cardTitle}>Escala sem aumentar equipe</div>
            <div className={bentoStyles.cardText}>
              Com a Turya, um corretor sozinho consegue processar o volume de análises que antes exigia uma equipe técnica dedicada, sem contratar, sem terceirizar.
            </div>
            <div className={bentoStyles.pill}>
              <span className={bentoStyles.pillDot} aria-hidden />
              1 corretor = equipe inteira
            </div>
          </motion.div>

          {/* C6 — Mercado */}
          <motion.div
            className={`${bentoStyles.card} ${bentoStyles.c6}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45 }}
          >
            <div className={bentoStyles.iconWrap} aria-hidden>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="26" cy="26" rx="18" ry="18" stroke="rgba(234,100,36,0.25)" strokeWidth="0.75" strokeDasharray="2 3" className="bp-stroke" />
                <ellipse cx="26" cy="26" rx="18" ry="9" stroke="rgba(234,100,36,0.2)" strokeWidth="0.75" strokeDasharray="2 3" className="bp-stroke" />
                <line x1="8" y1="26" x2="44" y2="26" stroke="rgba(234,100,36,0.2)" strokeWidth="0.75" strokeDasharray="2 3" className="bp-stroke" />
                <line x1="26" y1="8" x2="26" y2="44" stroke="rgba(234,100,36,0.2)" strokeWidth="0.75" strokeDasharray="2 3" className="bp-stroke" />
                <path d="M 26 8 Q 36 26 26 44" stroke="rgba(234,100,36,0.2)" strokeWidth="0.75" strokeDasharray="2 3" fill="none" className="bp-stroke" />
                <path d="M 26 8 Q 16 26 26 44" stroke="rgba(234,100,36,0.2)" strokeWidth="0.75" strokeDasharray="2 3" fill="none" className="bp-stroke" />
                <path
                  d="M26 12 C21 12 17 16 17 21 C17 28 26 36 26 36 C26 36 35 28 35 21 C35 16 31 12 26 12 Z"
                  stroke="rgba(234,100,36,0.75)"
                  strokeWidth="1"
                  fill="rgba(234,100,36,0.07)"
                  className="bp-stroke bp-fill"
                />
                <circle cx="26" cy="21" r="4" stroke="#EA6424" strokeWidth="1" fill="rgba(234,100,36,0.15)" className="bp-accent bp-fill" />
                <line x1="26" y1="18" x2="26" y2="19.5" stroke="rgba(234,100,36,0.6)" strokeWidth="0.75" />
                <line x1="26" y1="22.5" x2="26" y2="24" stroke="rgba(234,100,36,0.6)" strokeWidth="0.75" />
                <line x1="23" y1="21" x2="24.5" y2="21" stroke="rgba(234,100,36,0.6)" strokeWidth="0.75" />
                <line x1="27.5" y1="21" x2="29" y2="21" stroke="rgba(234,100,36,0.6)" strokeWidth="0.75" />
                <line x1="44" y1="48" x2="48" y2="48" stroke="rgba(234,100,36,0.15)" strokeWidth="0.75" />
                <line x1="48" y1="44" x2="48" y2="48" stroke="rgba(234,100,36,0.15)" strokeWidth="0.75" />
              </svg>
            </div>

            <div className={bentoStyles.cardTitle}>Treinado para o mercado brasileiro</div>
            <div className={bentoStyles.cardText}>
              A IA conhece as particularidades do D&O brasileiro, determina limitações das seguradoras locais, estruturas de franquia regionais e os padrões de cobertura do mercado nacional.
            </div>
          </motion.div>
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

          <div className="w-full md:w-[420px] rounded-2xl border border-border/50 bg-background/40 px-12 py-8 text-center">
            <div ref={timerRef} className="w-full">
              <div className="w-full text-[11px] md:text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em] whitespace-nowrap text-center">
                Comparativo de tempo (1 análise)
              </div>

              <div className="mt-3 grid grid-cols-[1.3fr_1fr] items-center justify-items-center gap-6 w-full">
                <div className="text-center">
                  <div className="text-xs font-semibold text-muted-foreground text-center w-full">
                    Manual
                  </div>
                  <div className="text-3xl font-bold text-gradient-warm leading-tight mt-1 whitespace-nowrap tabular-nums text-center font-mono">
                    {formatHHMM(manualRemainingMs)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 text-center w-full">
                    restante estimado
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs font-semibold text-muted-foreground text-center w-full">
                    Turya
                  </div>
                  <div className="text-3xl font-bold text-gradient-warm leading-tight mt-1 whitespace-nowrap tabular-nums text-center font-mono">
                    {formatMMSS(turyaRemainingMs)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 text-center w-full">
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
