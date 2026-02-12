import { motion } from "framer-motion";
import turyaLogo from "@/assets/turya-logo.png";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-transparent"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <motion.img
          src={turyaLogo}
          alt="Turya - Inteligência Artificial"
          className="h-32 md:h-40 w-auto"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        />
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#upload"
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('upload');
              if (element) {
                const headerOffset = 100;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
              }
            }}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium cursor-pointer"
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
