import { motion } from "framer-motion";
import turyaLogo from "@/assets/turya-logo.png";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/30"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <motion.img
          src={turyaLogo}
          alt="Turya - Inteligência Artificial"
          className="h-10 md:h-12 w-auto"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        />
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#upload"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Analisar Cotações
          </a>
          <a
            href="#beneficios"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Benefícios
          </a>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
