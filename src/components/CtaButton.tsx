import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type CtaButtonProps = {
  children: ReactNode;
  href?: string;
  size?: "md" | "sm";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

export function CtaButton({
  children,
  href,
  size = "md",
  className,
  onClick,
  type = "button",
  disabled,
}: CtaButtonProps) {
  const boxClass = cn("btn-cta-box", size === "sm" && "btn-cta-sm", className);

  if (href) {
    return (
      <a href={href} className={boxClass} onClick={onClick}>
        <span className="btn-cta">{children}</span>
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} className={boxClass} onClick={onClick}>
      <span className="btn-cta">{children}</span>
    </button>
  );
}

export function scrollToUpload(e?: React.MouseEvent) {
  e?.preventDefault();
  const element = document.getElementById("upload");
  if (!element) return;
  const headerOffset = 80;
  const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
  window.scrollTo({ top: offsetPosition, behavior: "smooth" });
}
