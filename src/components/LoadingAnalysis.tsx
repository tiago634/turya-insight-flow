import { useState, useEffect } from "react";
import styles from "./LoadingAnalysis.module.css";

const CLAUSES = [
  "Cláusula 3.1 — Cobertura Principal",
  "Cláusula 4.2 — Limite de Responsabilidade",
  "Cláusula 5.0 — Franquia Mínima",
  "Cláusula 6.3 — Exclusões Específicas",
  "Cláusula 7.1 — Retroatividade",
  "Cláusula 8.4 — Condições Especiais",
];

interface LoadingAnalysisProps {
  sessionId: string;
  statusCheckUrl?: string;
}

const LoadingAnalysis = ({ sessionId, statusCheckUrl }: LoadingAnalysisProps) => {
  const [clauseIndex, setClauseIndex] = useState(0);
  const [clauseVisible, setClauseVisible] = useState(true);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setClauseVisible(false);
      timeoutId = setTimeout(() => {
        setClauseIndex((i) => (i + 1) % CLAUSES.length);
        setClauseVisible(true);
      }, 320);
    }, 3800);
    return () => {
      clearInterval(id);
      clearTimeout(timeoutId!);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSecs((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timerStr = `${Math.floor(elapsedSecs / 60)}:${String(elapsedSecs % 60).padStart(2, "0")}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.noise} aria-hidden />

      <nav className={styles.nav}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="7" fill="none" stroke="#fff" strokeWidth="2" />
              <circle cx="10" cy="10" r="2.5" fill="#fff" />
            </svg>
          </div>
          <span className={styles.logoName}>turya</span>
        </div>
        <div className={styles.navR}>D&O · Análise inteligente</div>
      </nav>

      <div className={styles.page}>
        <div className={styles.left}>
          <div className={styles.eyebrow}>Análise D&O em andamento</div>
          <h1 className={styles.headline}>
            Lendo cada
            <br />
            <em>cláusula com</em>
            <br />
            atenção.
          </h1>
          <p className={styles.bodyText}>
            Seus documentos estão sendo revisados em profundidade — coberturas, franquias, sublimites e condições especiais.
          </p>
          <div className={styles.progressArea}>
            <div className={styles.progressLineWrap}>
              <div className={styles.progressFill} />
              <div className={styles.progressDot} />
            </div>
            <div className={styles.progressMeta}>
              <span className={styles.progressLabel}>
                Processando<span className={styles.blink} />
              </span>
              <span className={styles.timer}>{timerStr}</span>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.filing}>
            <div className={`${styles.sheet} ${styles.sheet3}`} />
            <div className={`${styles.sheet} ${styles.sheet2}`} />
            <div className={`${styles.sheet} ${styles.sheet1}`}>
              <div className={styles.sheetInner}>
                <div className={styles.sheetHeader}>
                  <div>
                    <div className={styles.shTag}>Documento em análise</div>
                    <div className={styles.shTitle}>D&O</div>
                  </div>
                  <div className={styles.shPill}>Lendo</div>
                </div>
                <div className={styles.lines}>
                  <div className={`${styles.ln} ${styles.ln100} ${styles.read}`} />
                  <div className={`${styles.ln} ${styles.ln90} ${styles.read}`} />
                  <div className={`${styles.ln} ${styles.ln80} ${styles.read}`} />
                  <div className={`${styles.ln} ${styles.ln65} ${styles.read}`} />
                  <div className={`${styles.ln} ${styles.ln100} ${styles.reading}`} />
                  <div className={`${styles.ln} ${styles.ln80}`} />
                  <div className={`${styles.ln} ${styles.ln45}`} />
                </div>
                <div className={styles.clauseBlock}>
                  <div
                    className={styles.clauseTag}
                    style={{
                      opacity: clauseVisible ? 1 : 0,
                      transition: "opacity 0.3s",
                    }}
                  >
                    {CLAUSES[clauseIndex]}
                  </div>
                  <div className={styles.clauseLines}>
                    <div className={`${styles.cl} ${styles.cl95}`} />
                    <div className={`${styles.cl} ${styles.cl80}`} />
                    <div className={`${styles.cl} ${styles.cl60}`} />
                  </div>
                </div>
              </div>
              <div className={styles.fold} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnalysis;
