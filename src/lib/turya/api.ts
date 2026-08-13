import { STATUS_CHECK_URL, WEBHOOK_INPUT_URL, WEBHOOK_OUTPUT_URL } from "./config";

/** Só logs extras no console; não altera download do HTML nem da planilha. ?turya_diag=1 | localStorage turya_diag=1 | window.__TURYA_DIAG__ */
export function isTuryaDiagEnabled(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem("turya_diag") === "1") return true;
    if (sessionStorage.getItem("turya_diag") === "1") return true;
    if (new URLSearchParams(window.location.search).get("turya_diag") === "1") return true;
    return (window as unknown as { __TURYA_DIAG__?: boolean }).__TURYA_DIAG__ === true;
  } catch {
    return false;
  }
}

export function logTuryaPollingDiagnostics(
  phase: "conclusao" | "followup",
  backendUrl: string,
  sessionId: string,
  data: Record<string, unknown>,
  secondary: { blob: Blob; fileName: string } | null
) {
  const h = data.html_content;
  const x = data.xlsx_content;
  const a = data.Analise_Turya_XLSX;
  const diag = {
    fase: phase,
    backend_url_usada: backendUrl,
    session_id: sessionId,
    chaves_na_resposta: Object.keys(data),
    status: data.status,
    html_content: typeof h === "string" ? `${h.length} chars base64` : "ausente",
    xlsx_content: typeof x === "string" ? `${x.length} chars base64` : "ausente",
    Analise_Turya_XLSX: typeof a === "string" ? `${a.length} chars base64` : "ausente",
  };
  console.info("[Turya DIAG] Resumo do GET /api/analysis (compare com Railway):", diag);
  if (secondary) {
    console.info("[Turya DIAG] Extração secundária:", "OK", secondary.fileName, secondary.blob.size, "bytes");
  } else {
    console.warn(
      "[Turya DIAG] Extração secundária: FALHOU (blob null).",
      "Se xlsx_content aparece acima com tamanho > 0 e mesmo assim falhou → bug no decode do front.",
      "Se xlsx_content está ausente → JSON não traz planilha (backend, proxy ou URL errada)."
    );
  }
}

export function buildAnalysisFormData(files: File[], sessionId: string): FormData {
  const formData = new FormData();

  // Adicionar arquivos
  files.forEach((file, index) => {
    formData.append(`arquivo_${index}`, file);
  });

  // Adicionar metadados
  formData.append("session_id", sessionId);
  formData.append("timestamp", new Date().toISOString());
  formData.append("quantidade_arquivos", files.length.toString());

  // URL do webhook de saída (onde o n8n enviará o resultado - se usar fluxo assíncrono)
  formData.append("webhook_output_url", WEBHOOK_OUTPUT_URL);

  return formData;
}

export function sendDocumentsToN8n(formData: FormData, signal: AbortSignal): Promise<Response> {
  // Enviar para webhook de ENTRADA do n8n (não esperamos resposta síncrona)
  return fetch(WEBHOOK_INPUT_URL, {
    method: "POST",
    body: formData,
    signal,
  });
}

export function fetchAnalysisStatus(sessionId: string): Promise<Response> {
  // Query param evita cache do navegador (304) e garante resposta sempre atual
  const url = `${STATUS_CHECK_URL}/api/analysis/${sessionId}?t=${Date.now()}`;
  return fetch(url);
}
