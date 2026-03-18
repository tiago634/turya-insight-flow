import { useEffect, useState } from "react";
import styles from "./DownloadReport.module.css";

interface DownloadResult {
  downloadUrl?: string;
}

interface DownloadReportProps {
  onReset: () => void;
  /** Quando o relatório vem do polling (backend), o Index passa o Blob. Senão usa localStorage/query. */
  htmlBlob?: Blob | null;
}

const DownloadReport = ({ onReset, htmlBlob }: DownloadReportProps) => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (htmlBlob && htmlBlob.size > 0) {
      const url = URL.createObjectURL(htmlBlob);
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
  }, [htmlBlob]);

  const handleNewQuotes = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onReset();
  };

  const href = downloadUrl ?? "#";
  const isValidUrl = !!downloadUrl && downloadUrl !== "#";
  const isBlobUrl = downloadUrl?.startsWith("blob:") ?? false;

  return (
    <div className={styles.wrapper}>
      <div className={styles.noise} aria-hidden />

      <nav className={styles.nav}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="7"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle cx="10" cy="10" r="2.5" />
            </svg>
          </div>
          <span className={styles.logoName}>turya</span>
        </div>
        <div className={styles.navTag}>D&amp;O · Análise inteligente</div>
      </nav>

      <div className={styles.scene}>
        <div className={styles.centerLine} />

        <div className={styles.colLeft}>
          <div className={styles.bgNumber}>D&amp;O</div>

          <div className={styles.tag}>Relatório concluído</div>

          <h1 className={styles.headline}>
            Pronto
            <br />
            <span>para decidir.</span>
          </h1>

          <div className={styles.divider} />

          <p className={styles.body}>
            O relatório comparativo das suas cotações D&amp;O está gerado.
            <br />
            <em>Abra o arquivo e tome sua decisão com clareza.</em>
          </p>

          <div className={styles.btns}>
            <a
              id="btnDownload"
              className={styles.btnDl}
              href={href}
              target={isValidUrl && !isBlobUrl ? "_blank" : undefined}
              rel={isValidUrl && !isBlobUrl ? "noreferrer" : undefined}
              download={isValidUrl ? "Analise_DO.html" : undefined}
            >
              Baixar relatório
              <svg className={styles.btnDlIcon} viewBox="0 0 24 24">
                <path d="M12 15V3M12 15l-4-4M12 15l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
              </svg>
            </a>

            <a href="#" className={styles.btnNew} onClick={handleNewQuotes}>
              <svg className={styles.btnNewIcon} viewBox="0 0 24 24">
                <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.93-3.36M20 15A9 9 0 015.07 18.36" />
              </svg>
              Enviar novas cotações
            </a>
          </div>
        </div>

        <div className={styles.colRight}>
          <div className={styles.composition}>
            <div className={styles.floatNum}>01</div>

            <div className={`${styles.sheet} ${styles.s3}`} />
            <div className={`${styles.sheet} ${styles.s2}`} />

            <div className={`${styles.sheet} ${styles.s1}`}>
              <div className={styles.docHead}>
                <div>
                  <div className={styles.docCo}>Turya Intelligence</div>
                  <div className={styles.docTitle}>Análise Comparativa D&amp;O</div>
                </div>
                <div className={styles.docSeal}>
                  <svg className={styles.docSealIcon} viewBox="0 0 24 24">
                    <polyline points="4 12 9 17 20 7" />
                  </svg>
                </div>
              </div>

              <div className={styles.docBody}>
                <div className={styles.docSection}>
                  <div className={styles.docSectionTitle}>Coberturas</div>
                  <div className={styles.docLines}>
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w100}`} />
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w85}`} />
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w70}`} />
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w90}`} />
                  </div>
                </div>

                <div className={styles.docSection}>
                  <div className={styles.docSectionTitle}>Franquias &amp; Sublimites</div>
                  <div className={styles.docLines}>
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w100}`} />
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w55}`} />
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w85}`} />
                  </div>
                </div>

                <div className={styles.docSection}>
                  <div className={styles.docSectionTitle}>Condições Especiais</div>
                  <div className={styles.docLines}>
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w100}`} />
                    <div className={`${styles.ln} ${styles.lnDone} ${styles.w70}`} />
                    <div className={`${styles.ln} ${styles.lnPlain} ${styles.w40}`} />
                  </div>
                </div>
              </div>

              <div className={styles.docSign}>
                <div className={styles.signLeft}>Analise_DO.html</div>
                <div className={styles.signStamp}>Verificado · Turya</div>
              </div>

              <div className={styles.fold} />
            </div>

            <div className={styles.compShadow} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadReport;
