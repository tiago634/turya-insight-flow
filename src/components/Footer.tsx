interface FooterProps {
  onOpenTerms?: () => void;
}

const Footer = ({ onOpenTerms }: FooterProps) => {
  return (
    <footer className="border-t border-white/5 px-6 py-11 text-center text-xs tracking-[1.5px] text-white/68">
      <div className="mb-5 flex flex-wrap items-center justify-center gap-6">
        <a
          href="https://turya.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/68 no-underline transition-colors hover:text-turya-gold"
        >
          turya.ai
        </a>
        <a
          href="#"
          className="text-white/68 no-underline transition-colors hover:text-turya-gold"
          onClick={(e) => {
            e.preventDefault();
            onOpenTerms?.();
          }}
        >
          Termos de Uso
        </a>
        <a
          href="mailto:contato@turya.ai"
          className="text-white/68 no-underline transition-colors hover:text-turya-gold"
        >
          contato@turya.ai
        </a>
      </div>
      <span className="lowercase">turya · inteligência vertical para o mercado segurador brasileiro</span>
      <span className="mx-auto mt-3 block max-w-[620px] text-[11.5px] tracking-[0.4px] text-white/50">
        © 2026 Turya. Análise inteligente de cotações D&amp;O para corretores de seguros.
      </span>
    </footer>
  );
};

export default Footer;
