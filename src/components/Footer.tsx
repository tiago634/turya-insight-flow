interface FooterProps {
  onOpenTerms?: () => void;
}

const Footer = ({ onOpenTerms }: FooterProps) => {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.preventDefault();
                onOpenTerms?.();
              }}
            >
              Termos de Uso
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2026 Turya | Inteligência para Seguros
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
