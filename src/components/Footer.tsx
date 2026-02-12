import { motion } from "framer-motion";
import turyaLogo from "@/assets/turya-logo.png";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.img
            src={turyaLogo}
            alt="Turya"
            className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.02 }}
          />
          
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos de Uso
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidade
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2026 Turya — Inteligência para Seguros
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
