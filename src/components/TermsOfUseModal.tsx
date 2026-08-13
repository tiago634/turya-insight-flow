import { useEffect, useRef, useState } from "react";
import { useTermsGate } from "@/hooks/useTermsGate";
import { cn } from "@/lib/utils";

const TermsOfUseModal = () => {
  const { termsOpen: open, handleAcceptTerms: onAccept, handleCancelTerms: onCancel } = useTermsGate();
  const [checked, setChecked] = useState(false);
  const [hideScrollHint, setHideScrollHint] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const openedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!open) return;
    setChecked(false);
    setHideScrollHint(false);

    const el = bodyRef.current;
    if (el) el.scrollTop = 0;

    // Prevent background scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    openedAtRef.current = Date.now();

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/82 p-6 backdrop-blur-[12px]"
      onMouseDown={(e) => {
        // Evita fechar automaticamente no mesmo clique que disparou a abertura do modal.
        if (Date.now() - openedAtRef.current < 250) return;
        if (e.target === e.currentTarget) onCancel();
      }}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-[680px] flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative shrink-0 overflow-hidden rounded-t-[18px] border border-white/[.07] border-b-0 bg-[#0c0814] px-9 pb-7 pt-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow-turya mb-2">Antes de continuar</div>
              <div className="text-[22px] font-extralight tracking-[-0.5px]">Termos de Uso</div>
            </div>
            <div className="rounded-full border border-[rgba(255,180,110,.3)] px-3 py-1 text-[11px] tracking-widest text-turya-gold">
              Versão MVP
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[rgba(255,180,110,.25)] bg-[rgba(234,100,36,.08)] p-3.5">
            <div className="mt-0.5 shrink-0 text-turya-orange" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div className="text-[13px] leading-relaxed text-white/80">
              A plataforma está em fase MVP. A inteligência artificial{" "}
              <strong>pode cometer erros.</strong> Os relatórios são ferramentas de
              apoio e a responsabilidade técnica pela orientação ao cliente é{" "}
              <strong>sempre do corretor habilitado.</strong>
            </div>
          </div>
        </div>

        <div
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-y-auto border-x border-white/[.07] bg-[#0c0814]"
          onScroll={() => {
            const el = bodyRef.current;
            if (!el) return;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
              setHideScrollHint(true);
            }
          }}
        >
          <div className="px-9">
            <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-white/[.04] py-6">
              <div className="pt-0.5 font-mono text-[11px] leading-none text-[rgba(234,100,36,.6)]">01</div>
              <div>
                <div className="mb-2 text-sm font-semibold tracking-[-0.01em] text-white">Aceitação dos Termos</div>
                <p className="text-[13px] font-normal leading-[1.7] text-white/55">
                  Ao utilizar a plataforma Turya D&O, o Usuário declara ter lido,
                  compreendido e concordado integralmente com estes Termos. O uso
                  implica aceitação plena e irretratável. Caso não concorde,
                  abstenha-se de utilizar a Plataforma.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-white/[.04] py-6">
              <div className="pt-0.5 font-mono text-[11px] leading-none text-[rgba(234,100,36,.6)]">02</div>
              <div>
                <div className="mb-2 text-sm font-semibold tracking-[-0.01em] text-white">
                  Natureza do Serviço e Fase de MVP
                </div>
                <p className="text-[13px] font-normal leading-[1.7] text-white/55">
                  A Plataforma é uma ferramenta de apoio à análise comparativa de
                  cotações D&O baseada em inteligência artificial. O Usuário
                  reconhece expressamente que:
                </p>
                <ul className="mt-2 flex list-none flex-col gap-1.5 p-0">
                  <li className="clause-li">A Plataforma está em desenvolvimento ativo (MVP), sujeita a aprimoramentos contínuos</li>
                  <li className="clause-li">Os modelos de IA estão em processo de treinamento e validação, podendo apresentar imprecisões ou interpretações incorretas de cláusulas</li>
                  <li className="clause-li">Nenhum resultado deve ser considerado definitivo, completo ou isento de erros</li>
                  <li className="clause-li">A ferramenta é auxiliar e não substitui o trabalho técnico do corretor em nenhuma hipótese</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-white/[.04] py-6">
              <div className="pt-0.5 font-mono text-[11px] leading-none text-[rgba(234,100,36,.6)]">03</div>
              <div>
                <div className="mb-2 text-sm font-semibold tracking-[-0.01em] text-white">Limitação de Responsabilidade</div>
                <p className="text-[13px] font-normal leading-[1.7] text-white/55">
                  A Turya Tecnologia Ltda. não se responsabiliza por:
                </p>
                <ul className="mt-2 flex list-none flex-col gap-1.5 p-0">
                  <li className="clause-li">Decisões comerciais ou contratuais tomadas com base nos relatórios gerados</li>
                  <li className="clause-li">Erros, omissões ou interpretações incorretas produzidas pela inteligência artificial</li>
                  <li className="clause-li">Divergências entre os dados extraídos e o conteúdo original das apólices</li>
                  <li className="clause-li">Perdas financeiras ou danos decorrentes do uso da Plataforma</li>
                  <li className="clause-li">Reclamações de terceiros, inclusive segurados e seguradoras, em razão de análises realizadas com auxílio da Plataforma</li>
                </ul>
                <div className="mt-2.5 rounded-r-sm border-l-2 border-[rgba(234,100,36,.3)] bg-white/[.02] px-3.5 py-2.5">
                  <p className="text-[13px] font-normal leading-[1.65] text-white/55">
                    A responsabilidade técnica e profissional pela recomendação ao
                    cliente final é sempre e integralmente do corretor habilitado,
                    nos termos da regulamentação da SUSEP e do CNSP.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-white/[.04] py-6">
              <div className="pt-0.5 font-mono text-[11px] leading-none text-[rgba(234,100,36,.6)]">04</div>
              <div>
                <div className="mb-2 text-sm font-semibold tracking-[-0.01em] text-white">Obrigações do Usuário</div>
                <ul className="mt-2 flex list-none flex-col gap-1.5 p-0">
                  <li className="clause-li">Verificar e validar as informações dos relatórios antes de utilizá-los com clientes</li>
                  <li className="clause-li">Garantir que os documentos enviados não violam acordos de confidencialidade com as seguradoras</li>
                  <li className="clause-li">Utilizar a Plataforma em conformidade com a regulamentação da SUSEP e do CNSP</li>
                  <li className="clause-li">Não utilizar os relatórios como única fonte de informação para orientação ao segurado</li>
                  <li className="clause-li">Comunicar à Turya qualquer imprecisão identificada, contribuindo para o aperfeiçoamento da ferramenta</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-white/[.04] py-6">
              <div className="pt-0.5 font-mono text-[11px] leading-none text-[rgba(234,100,36,.6)]">05</div>
              <div>
                <div className="mb-2 text-sm font-semibold tracking-[-0.01em] text-white">Privacidade e Tratamento de Documentos</div>
                <ul className="mt-2 flex list-none flex-col gap-1.5 p-0">
                  <li className="clause-li">Os arquivos enviados são processados automaticamente e descartados após a análise</li>
                  <li className="clause-li">Não são armazenados dados pessoais de segurados além do estritamente necessário</li>
                  <li className="clause-li">O Usuário é responsável pela conformidade com a LGPD (Lei nº 13.709/2018)</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-white/[.04] py-6">
              <div className="pt-0.5 font-mono text-[11px] leading-none text-[rgba(234,100,36,.6)]">06</div>
              <div>
                <div className="mb-2 text-sm font-semibold tracking-[-0.01em] text-white">Propriedade Intelectual</div>
                <p className="text-[13px] font-normal leading-[1.7] text-white/55">
                  Todos os elementos da Plataforma são de propriedade exclusiva
                  da Turya Tecnologia Ltda. Os relatórios são licenciados ao
                  Usuário para uso interno e profissional. É vedada a reprodução
                  ou comercialização sem autorização expressa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-white/[.04] py-6">
              <div className="pt-0.5 font-mono text-[11px] leading-none text-[rgba(234,100,36,.6)]">07</div>
              <div>
                <div className="mb-2 text-sm font-semibold tracking-[-0.01em] text-white">Foro e Legislação Aplicável</div>
                <p className="text-[13px] font-normal leading-[1.7] text-white/55">
                  Estes Termos são regidos pela legislação brasileira. Fica eleito
                  o foro da comarca de São Paulo/SP para dirimir controvérsias,
                  com renúncia a qualquer outro.
                </p>
              </div>
            </div>

            <div className="mb-6 border border-white/[.06] bg-white/[.02] px-5 py-[18px]">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-turya-orange/80">
                Declaração de aceite
              </div>
              <p className="text-[13px] font-normal leading-[1.7] text-white/55">
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

        <div className="shrink-0 rounded-b-[18px] border border-t-[rgba(255,255,255,.05)] border-white/[.07] bg-[#0c0814] px-9 pb-6 pt-5">
          <div
            id="scrollHint"
            className={cn(
              "mb-3.5 flex items-center justify-center gap-1.5 overflow-hidden font-mono text-[9px] uppercase tracking-[0.1em] text-white/35 transition-all duration-[400ms]",
              hideScrollHint && "mb-0 h-0 opacity-0"
            )}
          >
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 animate-bounce fill-none stroke-current stroke-2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Role para ler todos os termos
          </div>

          <div
            className={cn(
              "mb-4 flex cursor-pointer items-start gap-3 rounded-sm border bg-white/[.02] px-4 py-3.5 transition-colors",
              checked
                ? "border-[rgba(234,100,36,.25)] bg-white/[.03]"
                : "border-white/[.06] hover:border-[rgba(234,100,36,.2)] hover:bg-white/[.03]"
            )}
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
            <div
              className={cn(
                "mt-px grid h-4 w-4 shrink-0 place-items-center rounded-sm border transition-colors",
                checked ? "border-turya-orange bg-turya-orange" : "border-white/15"
              )}
              aria-hidden
            >
              <svg
                viewBox="0 0 12 12"
                className={cn(
                  "h-[9px] w-[9px] fill-none stroke-white stroke-[2.5] transition-all duration-150",
                  checked ? "scale-100 opacity-100" : "scale-50 opacity-0"
                )}
              >
                <polyline points="2 6 5 9 10 3" />
              </svg>
            </div>
            <span className="select-none text-[13px] font-normal leading-relaxed text-white/60">
              Li e compreendo os termos. Estou ciente de que a plataforma está
              em fase MVP e que{" "}
              <strong className="font-semibold text-white">
                a responsabilidade técnica pela orientação ao cliente é minha.
              </strong>
            </span>
          </div>

          <div className="flex gap-2">
            <button
              className="whitespace-nowrap rounded-sm border border-white/[.06] bg-transparent px-5 py-3 text-xs tracking-wide text-white/40 transition-colors hover:border-white/10 hover:text-white/60"
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              className="flex-1 rounded-sm bg-turya-orange px-6 py-3 text-[13px] font-medium tracking-wide text-white transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#1a1a1a] disabled:text-[#333]"
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

