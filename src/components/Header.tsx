import { useEffect, useState } from "react";
import turyaLogo from "@/assets/turya-logo.png";
import { CtaButton, scrollToUpload } from "@/components/CtaButton";
import { cn } from "@/lib/utils";

type HeaderProps = {
  variant?: "marketing" | "brand";
};

const Header = ({ variant = "marketing" }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-3.5 transition-[background,padding,backdrop-filter] duration-[400ms] md:px-8 md:py-5",
        scrolled && "bg-[#070410]/28 py-3 backdrop-blur-[10px] md:py-3.5"
      )}
    >
      <a
        href={variant === "marketing" ? "#hero" : "/"}
        className="block"
        aria-label="Turya"
      >
        <img
          src={turyaLogo}
          alt="Turya"
          width={200}
          height={64}
          className="block h-auto w-[120px] max-w-[35vw] sm:w-[140px] md:w-[150px] md:max-w-[38vw]"
        />
      </a>

      {variant === "marketing" && (
        <div className="flex items-center gap-4 md:gap-6">
          <a
            href="#como-funciona"
            className="hidden text-[13px] font-normal tracking-[0.5px] text-white/88 transition-colors hover:text-turya-gold md:inline"
          >
            Como funciona
          </a>
          <a
            href="#beneficios"
            className="hidden text-[13px] font-normal tracking-[0.5px] text-white/88 transition-colors hover:text-turya-gold md:inline"
          >
            Benefícios
          </a>
          <CtaButton size="sm" href="#upload" onClick={scrollToUpload}>
            ANALISAR COTAÇÕES
          </CtaButton>
        </div>
      )}
    </nav>
  );
};

export default Header;
