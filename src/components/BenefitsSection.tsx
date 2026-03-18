import { motion } from "framer-motion";
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
      "A IA lê coberturas, sublimites, franquias, retroatividade de exclusões específicas de cada seguradora — e formaliza tudo em taxonomia padronizada para comparação real.",
    footer: {
      kind: "highlight",
      text: "Nenhuma cláusula passa despercebida — nem as que prejudicam o seguro",
    },
  },
  {
    iconType: "brain" as const,
    title: "Relatório pronto para o cliente",
    description:
      "O relatório HTML gerado é visualmente profissional — e permite entrega ao cliente algo que nenhum concorrente consegue produzir na mesma velocidade.",
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
      "Toda análise gerada segue o mesmo critério técnico — independente de quem fez o upload. Sem variação de qualidade entre analistas, sem interpretações divergentes entre atendimentos.",
  },
  {
    iconType: "chart" as const,
    title: "Escala sem aumentar equipe",
    description:
      "Com a Turya, um corretor sozinho consegue processar o volume de análises que antes exigia uma equipe técnica dedicada — sem contratar, sem terceirizar.",
  },
  {
    iconType: "brain" as const,
    title: "Treinado para o mercado brasileiro",
    description:
      "A IA conhece as particularidades do D&O brasileiro — determina limitações das seguradoras locais, estruturas de franquia, regionais e os padrões de cobertura do mercado nacional.",
  },
];

type Footer =
  | { kind: "single"; text: string }
  | { kind: "highlight"; text: string }
  | { kind: "dual"; top: string; bottom: string };

const BenefitsSection = () => {
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
            manualmente cláusula por cláusula. A Turya elimina esse gargalo — sem
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
              O corretor que usa a Turya fecha mais, em menos tempo.
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Enquanto a concorrência ainda está montando planilhas, você já está
              apresentando o relatório — e ganhando a confiança do cliente com
              profissionalismo que eles nunca viram antes.
            </p>
          </div>

          <div className="w-full md:w-[260px] rounded-2xl border border-border/50 bg-background/40 px-8 py-6 text-center">
            <div className="text-4xl md:text-5xl font-bold text-gradient-warm">
              5 min
            </div>
            <div className="text-xs md:text-sm font-semibold text-muted-foreground uppercase mt-1">
              VS HORAS DE TRABALHO MANUAL
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
