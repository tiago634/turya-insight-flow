import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./TermsOfUseModal.module.css";

interface TermsOfUseModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const TermsOfUseModal = ({ open, onAccept, onCancel }: TermsOfUseModalProps) => {
  const [checked, setChecked] = useState(false);
  const [hideScrollHint, setHideScrollHint] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setChecked(false);
    setHideScrollHint(false);

    const el = bodyRef.current;
    if (el) el.scrollTop = 0;

    // Prevent background scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const scrollHintClass = useMemo(() => {
    return `${styles["scroll-hint"]} ${hideScrollHint ? styles.gone : ""}`.trim();
  }, [hideScrollHint]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="presentation"
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles["modal-top"]}>
          <div className={styles["top-row"]}>
            <div>
              <div className={styles["modal-eyebrow"]}>Antes de continuar</div>
              <div className={styles["modal-headline"]}>Termos de Uso</div>
            </div>
            <div className={styles["version-pill"]}>Versão MVP</div>
          </div>

          <div className={styles["modal-alert"]}>
            <div className={styles["alert-icon"]} aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div className={styles["alert-text"]}>
              A plataforma está em fase MVP. A inteligência artificial{" "}
              <strong>pode cometer erros.</strong> Os relatórios são ferramentas de
              apoio e a responsabilidade técnica pela orientação ao cliente é{" "}
              <strong>sempre do corretor habilitado.</strong>
            </div>
          </div>
        </div>

        <div
          ref={bodyRef}
          className={styles["modal-body"]}
          onScroll={() => {
            const el = bodyRef.current;
            if (!el) return;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
              setHideScrollHint(true);
            }
          }}
        >
          <div className={styles["terms-wrap"]}>
            <div className={styles["tclause"]}>
              <div className={styles["clause-num"]}>01</div>
              <div>
                <div className={styles["clause-title"]}>Aceitação dos Termos</div>
                <p className={styles["clause-text"]}>
                  Ao utilizar a plataforma Turya D&O, o Usuário declara ter lido,
                  compreendido e concordado integralmente com estes Termos. O uso
                  implica aceitação plena e irretratável. Caso não concorde,
                  abstenha-se de utilizar a Plataforma.
                </p>
              </div>
            </div>

            <div className={styles["tclause"]}>
              <div className={styles["clause-num"]}>02</div>
              <div>
                <div className={styles["clause-title"]}>
                  Natureza do Serviço e Fase de MVP
                </div>
                <p className={styles["clause-text"]}>
                  A Plataforma é uma ferramenta de apoio à análise comparativa de
                  cotações D&O baseada em inteligência artificial. O Usuário
                  reconhece expressamente que:
                </p>
                <ul className={styles["clause-list"]}>
                  <li>A Plataforma está em desenvolvimento ativo (MVP), sujeita a aprimoramentos contínuos</li>
                  <li>Os modelos de IA estão em processo de treinamento e validação, podendo apresentar imprecisões ou interpretações incorretas de cláusulas</li>
                  <li>Nenhum resultado deve ser considerado definitivo, completo ou isento de erros</li>
                  <li>A ferramenta é auxiliar e não substitui o trabalho técnico do corretor em nenhuma hipótese</li>
                </ul>
              </div>
            </div>

            <div className={styles["tclause"]}>
              <div className={styles["clause-num"]}>03</div>
              <div>
                <div className={styles["clause-title"]}>Limitação de Responsabilidade</div>
                <p className={styles["clause-text"]}>
                  A Turya Tecnologia Ltda. não se responsabiliza por:
                </p>
                <ul className={styles["clause-list"]}>
                  <li>Decisões comerciais ou contratuais tomadas com base nos relatórios gerados</li>
                  <li>Erros, omissões ou interpretações incorretas produzidas pela inteligência artificial</li>
                  <li>Divergências entre os dados extraídos e o conteúdo original das apólices</li>
                  <li>Perdas financeiras ou danos decorrentes do uso da Plataforma</li>
                  <li>Reclamações de terceiros, inclusive segurados e seguradoras, em razão de análises realizadas com auxílio da Plataforma</li>
                </ul>
                <div className={styles["clause-highlight"]}>
                  <p>
                    A responsabilidade técnica e profissional pela recomendação ao
                    cliente final é sempre e integralmente do corretor habilitado,
                    nos termos da regulamentação da SUSEP e do CNSP.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles["tclause"]}>
              <div className={styles["clause-num"]}>04</div>
              <div>
                <div className={styles["clause-title"]}>Obrigações do Usuário</div>
                <ul className={styles["clause-list"]}>
                  <li>Verificar e validar as informações dos relatórios antes de utilizá-los com clientes</li>
                  <li>Garantir que os documentos enviados não violam acordos de confidencialidade com as seguradoras</li>
                  <li>Utilizar a Plataforma em conformidade com a regulamentação da SUSEP e do CNSP</li>
                  <li>Não utilizar os relatórios como única fonte de informação para orientação ao segurado</li>
                  <li>Comunicar à Turya qualquer imprecisão identificada, contribuindo para o aperfeiçoamento da ferramenta</li>
                </ul>
              </div>
            </div>

            <div className={styles["tclause"]}>
              <div className={styles["clause-num"]}>05</div>
              <div>
                <div className={styles["clause-title"]}>Privacidade e Tratamento de Documentos</div>
                <ul className={styles["clause-list"]}>
                  <li>Os arquivos enviados são processados automaticamente e descartados após a análise</li>
                  <li>Não são armazenados dados pessoais de segurados além do estritamente necessário</li>
                  <li>O Usuário é responsável pela conformidade com a LGPD (Lei nº 13.709/2018)</li>
                </ul>
              </div>
            </div>

            <div className={styles["tclause"]}>
              <div className={styles["clause-num"]}>06</div>
              <div>
                <div className={styles["clause-title"]}>Propriedade Intelectual</div>
                <p className={styles["clause-text"]}>
                  Todos os elementos da Plataforma são de propriedade exclusiva
                  da Turya Tecnologia Ltda. Os relatórios são licenciados ao
                  Usuário para uso interno e profissional. É vedada a reprodução
                  ou comercialização sem autorização expressa.
                </p>
              </div>
            </div>

            <div className={styles["tclause"]}>
              <div className={styles["clause-num"]}>07</div>
              <div>
                <div className={styles["clause-title"]}>Foro e Legislação Aplicável</div>
                <p className={styles["clause-text"]}>
                  Estes Termos são regidos pela legislação brasileira. Fica eleito
                  o foro da comarca de São Paulo/SP para dirimir controvérsias,
                  com renúncia a qualquer outro.
                </p>
              </div>
            </div>

            <div className={styles["terms-final"]}>
              <div className={styles["terms-final-label"]}>Declaração de aceite</div>
              <p>
                Ao marcar a caixa abaixo, o Usuário declara que: (i) leu e
                compreendeu estes Termos; (ii) reconhece as limitações de uma
                ferramenta MVP baseada em IA; (iii) assume integral
                responsabilidade técnica pelas orientações prestadas aos seus
                clientes; e (iv) concorda que a Turya Tecnologia Ltda. não poderá
                ser responsabilizada por erros ou imprecisões nos relatórios gerados.
              </p>
            </div>
          </div>
        </div>

        <div className={styles["modal-foot"]}>
          <div className={scrollHintClass} id="scrollHint">
            <svg viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Role para ler todos os termos
          </div>

          <div
            className={`${styles["check-row"]} ${checked ? styles.checked : ""}`}
            id="checkRow"
            onMouseDown={(e) => {
              // Prevent blur/selection; keep it simple.
              e.preventDefault();
              setChecked((v) => !v);
            }}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setChecked((v) => !v);
              }
            }}
          >
            <div className={styles["check-box"]} aria-hidden>
              <svg viewBox="0 0 12 12">
                <polyline points="2 6 5 9 10 3" />
              </svg>
            </div>
            <span className={styles["check-label"]}>
              Li e compreendo os termos. Estou ciente de que a plataforma está
              em fase MVP e que{" "}
              <strong>
                a responsabilidade técnica pela orientação ao cliente é minha.
              </strong>
            </span>
          </div>

          <div className={styles["foot-btns"]}>
            <button className={styles["btn-cancel"]} type="button" onClick={onCancel}>
              Cancelar
            </button>
            <button
              className={styles["btn-accept"]}
              type="button"
              disabled={!checked}
              onClick={onAccept}
            >
              Concordo e continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUseModal;

