import { motion } from "framer-motion";
import { Zap, BarChart3, Brain } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Análise Instantânea",
    description:
      "Processamento em segundos. Sem esperas, sem burocracia. Sua análise pronta quando você precisar.",
  },
  {
    icon: BarChart3,
    title: "Comparativo Detalhado",
    description:
      "Visualize lado a lado todas as coberturas, exclusões e condições de cada cotação.",
  },
  {
    icon: Brain,
    title: "Powered by AI",
    description:
      "Inteligência artificial treinada especificamente para o mercado de seguros brasileiro.",
  },
];

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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que usar a <span className="text-gradient">Turya</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transforme dados em sabedoria com inteligência artificial especializada
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="card-elevated p-8 h-full group hover:border-primary/50 transition-all">
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:glow-button transition-shadow"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Icon className="w-8 h-8 text-foreground" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
