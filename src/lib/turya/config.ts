// URL do servidor webhook (Railway) - usa proxy para evitar CORS
export const WEBHOOK_SERVER_URL =
  import.meta.env.VITE_WEBHOOK_SERVER_URL || "http://localhost:3001";
// Endpoint proxy para enviar documentos ao n8n (via servidor webhook)
export const WEBHOOK_INPUT_URL = `${WEBHOOK_SERVER_URL}/api/send-to-n8n`;
// URL do servidor para receber webhook de saída (se usar fluxo assíncrono)
export const WEBHOOK_OUTPUT_URL = `${WEBHOOK_SERVER_URL}/webhook/result`;
// URL do servidor local para verificar status
export const STATUS_CHECK_URL = WEBHOOK_SERVER_URL;

export const POLLING_INTERVAL = 3000; // 3 segundos
export const MAX_POLLING_TIME = 10 * 60 * 1000; // 10 minutos (tempo máximo de espera pelo resultado)
/** O backend às vezes grava o XLS/XLSX no Redis pouco depois do HTML; buscamos de novo por alguns segundos. */
export const SECONDARY_FOLLOWUP_MS = 1000;
export const SECONDARY_FOLLOWUP_MAX_MS = 20_000;
export const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos (n8n pode demorar para processar)
