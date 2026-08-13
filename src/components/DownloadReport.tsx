import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { cn } from "@/lib/utils";

interface DownloadResult {
  downloadUrl?: string;
}

const DownloadReport = () => {
  const {
    htmlBlob,
    docxBlob,
    docxFileName = "Proposta_Comercial.docx",
    secondaryFileBlob,
    secondaryFileName = "Analise_Turya_XLSX",
    handleReset: onReset,
  } = useAnalysisFlow();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [secondaryDownloadUrl, setSecondaryDownloadUrl] = useState<string | null>(null);

  const primaryIsDocx = !!(docxBlob && docxBlob.size > 0);
  const primaryIsHtml = !primaryIsDocx && !!(htmlBlob && htmlBlob.size > 0);
  const primaryIsSheet =
    !primaryIsDocx && !primaryIsHtml && !!(secondaryFileBlob && secondaryFileBlob.size > 0);
  const primaryDownloadName = primaryIsDocx
    ? docxFileName
    : primaryIsSheet
      ? secondaryFileName
      : "Analise_DO.html";

  useEffect(() => {
    const primaryBlob = primaryIsDocx
      ? docxBlob
      : primaryIsHtml
        ? htmlBlob
        : primaryIsSheet
          ? secondaryFileBlob
          : null;
    if (primaryBlob && primaryBlob.size > 0) {
      const url = URL.createObjectURL(primaryBlob);
      setDownloadUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }

    function getResult(): DownloadResult {
      try {
        const s = localStorage.getItem("turya_result");
        if (s) return JSON.parse(s);
      } catch (e) {
        console.warn("turya_result inválido no localStorage", e);
      }
      const p = new URLSearchParams(window.location.search);
      return { downloadUrl: p.get("url") || "#" };
    }

    const result = getResult();
    if (result.downloadUrl && result.downloadUrl !== "#") {
      setDownloadUrl(result.downloadUrl);
    }
  }, [htmlBlob, docxBlob, secondaryFileBlob, primaryIsDocx, primaryIsHtml, primaryIsSheet]);

  useEffect(() => {
    if (primaryIsSheet) {
      setSecondaryDownloadUrl(null);
      return;
    }
    if (secondaryFileBlob && secondaryFileBlob.size > 0) {
      const url = URL.createObjectURL(secondaryFileBlob);
      setSecondaryDownloadUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setSecondaryDownloadUrl(null);
  }, [secondaryFileBlob, primaryIsSheet]);

  const handleNewQuotes = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onReset();
  };

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!downloadUrl || downloadUrl === "#") {
      e.preventDefault();
      return;
    }
    if (downloadUrl.startsWith("blob:")) {
      e.preventDefault();
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = primaryDownloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSecondaryDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!secondaryDownloadUrl || secondaryDownloadUrl === "#") {
      e.preventDefault();
      return;
    }
    if (secondaryDownloadUrl.startsWith("blob:")) {
      e.preventDefault();
      const a = document.createElement("a");
      a.href = secondaryDownloadUrl;
      a.download = secondaryFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const href = downloadUrl ?? "#";
  const isValidUrl = !!downloadUrl && downloadUrl !== "#";
  const isBlobUrl = downloadUrl?.startsWith("blob:") ?? false;
  const secondaryHref = secondaryDownloadUrl ?? "#";
  const hasSecondaryFile = !!secondaryDownloadUrl && secondaryDownloadUrl !== "#";

  const primaryLabel = primaryIsDocx
    ? "Baixar proposta (Word)"
    : primaryIsSheet
      ? "Baixar Análise XLSX"
      : "Baixar relatório";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070410] text-white">
      <Header variant="brand" />

      <div className="mx-auto grid min-h-screen max-w-[1180px] items-center gap-12 px-6 pb-16 pt-28 md:grid-cols-2 md:gap-16 md:px-10">
        <div>
          <div className="eyebrow-turya mb-6">relatório concluído</div>
          <h1 className="text-[clamp(36px,5.4vw,58px)] font-extralight leading-[1.2] tracking-[-0.5px]">
            Pronto
            <br />
            <span className="text-grad">para decidir.</span>
          </h1>
          <p className="mt-6 max-w-md text-[16px] font-light text-white/88">
            {primaryIsDocx
              ? "A proposta comercial das suas cotações D\u0026O está gerada em Word."
              : primaryIsSheet
                ? "A análise em planilha das suas cotações D\u0026O está pronta."
                : "O relatório comparativo das suas cotações D\u0026O está gerado."}{" "}
            <em className="text-white/68">Abra o arquivo e tome sua decisão com clareza.</em>
          </p>

          <div className="mt-10 flex flex-col items-start gap-4">
            <a
              id="btnDownload"
              className="btn-cta-box"
              href={href}
              target={isValidUrl && !isBlobUrl ? "_blank" : undefined}
              rel={isValidUrl && !isBlobUrl ? "noreferrer" : undefined}
              download={isValidUrl ? primaryDownloadName : undefined}
              onClick={handleDownload}
            >
              <span className="btn-cta">{primaryLabel}</span>
            </a>

            {!primaryIsSheet && (
              <>
                <a
                  id="btnDownloadSecondary"
                  href={secondaryHref}
                  download={secondaryFileName}
                  onClick={handleSecondaryDownload}
                  aria-disabled={!hasSecondaryFile}
                  className={cn(
                    "text-[13px] tracking-widest text-turya-gold no-underline transition-colors hover:text-white",
                    !hasSecondaryFile && "pointer-events-none opacity-40"
                  )}
                >
                  Baixar Análise XLSX →
                </a>
                <p className="max-w-md text-[12.5px] leading-relaxed text-white/68">
                  Este arquivo XLSX é editável e contém a base da análise. Para visualizar insights
                  valiosos da cotação e tecnologias acopladas como deep research, baixe a análise
                  principal.
                </p>
              </>
            )}

            <a
              href="#"
              onClick={handleNewQuotes}
              className="text-[13px] tracking-widest text-white/68 no-underline transition-colors hover:text-turya-gold"
            >
              enviar novas cotações →
            </a>
          </div>
        </div>

        <div
          className="relative rounded-[22px] border border-[rgba(255,180,110,.16)] bg-gradient-to-b from-[rgba(24,16,34,.85)] to-[rgba(12,8,20,.85)] p-6 shadow-[0_30px_80px_rgba(0,0,0,.5),0_0_50px_rgba(234,100,36,.08)]"
          aria-hidden
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] tracking-[2px] text-white/68">Turya Intelligence</div>
              <div className="mt-1 text-[15px] font-extrabold">Análise Comparativa D&amp;O</div>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(124,217,146,.4)] bg-[rgba(124,217,146,.12)] text-[#7CD992]">
              ✓
            </span>
          </div>
          <div className="space-y-5">
            {[
              { title: "Coberturas", widths: ["100%", "85%", "70%", "90%"] },
              { title: "Franquias & Sublimites", widths: ["100%", "55%", "85%"] },
              { title: "Condições Especiais", widths: ["100%", "70%", "40%"] },
            ].map((section) => (
              <div key={section.title}>
                <div className="mb-2 text-[11px] tracking-[2px] text-turya-gold">{section.title}</div>
                <div className="space-y-2">
                  {section.widths.map((w, i) => (
                    <div
                      key={`${section.title}-${i}`}
                      className="h-1.5 rounded-full bg-[rgba(234,100,36,.35)]"
                      style={{ width: w }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-[rgba(255,180,110,.16)] pt-4 text-[11.5px] text-white/68">
            <span className="truncate pr-4">{primaryDownloadName}</span>
            <span className="shrink-0 text-turya-gold">Verificado · Turya</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadReport;
