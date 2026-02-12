import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onSuccess: (htmlBlob: Blob) => void;
  onError: (message: string) => void;
  onStartProcessing: (sessionId: string) => void;
  sessionId: string | null;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["application/pdf"];
// URL do servidor webhook (Railway) - usa proxy para evitar CORS
const WEBHOOK_SERVER_URL = import.meta.env.VITE_WEBHOOK_SERVER_URL || "http://localhost:3001";
// Endpoint proxy para enviar documentos ao n8n (via servidor webhook)
const WEBHOOK_INPUT_URL = `${WEBHOOK_SERVER_URL}/api/send-to-n8n`;
// URL do servidor para receber webhook de saída (se usar fluxo assíncrono)
const WEBHOOK_OUTPUT_URL = `${WEBHOOK_SERVER_URL}/webhook/result`;
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos (n8n pode demorar para processar)

const UploadZone = ({ onSuccess, onError, onStartProcessing, sessionId }: UploadZoneProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: Apenas arquivos PDF são aceitos`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Arquivo muito grande (máx. 10MB)`;
    }
    return null;
  };

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const filesArray = Array.from(newFiles);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of filesArray) {
        const fileError = validateFile(file);
        if (fileError) {
          errors.push(fileError);
        } else if (files.length + validFiles.length >= MAX_FILES) {
          errors.push(`Máximo de ${MAX_FILES} arquivos permitido`);
          break;
        } else if (
          !files.some((f) => f.name === file.name && f.size === file.size)
        ) {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        setError(errors.join(". "));
      } else {
        setError(null);
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [files]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      setError("Selecione pelo menos um arquivo");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Gerar session_id único para esta análise
    const newSessionId = crypto.randomUUID();
    const formData = new FormData();

    // Adicionar arquivos
    files.forEach((file, index) => {
      formData.append(`arquivo_${index}`, file);
    });

    // Adicionar metadados
    formData.append("session_id", newSessionId);
    formData.append("timestamp", new Date().toISOString());
    formData.append("quantidade_arquivos", files.length.toString());
    
    // URL do webhook de saída (onde o n8n enviará o resultado - se usar fluxo assíncrono)
    formData.append("webhook_output_url", WEBHOOK_OUTPUT_URL);

    console.log(">>> ENVIANDO PARA N8N (WEBHOOK DE ENTRADA) <<<");
    console.log("Session ID:", newSessionId);
    console.log("Webhook de entrada:", WEBHOOK_INPUT_URL);
    console.log("Webhook de saída:", WEBHOOK_OUTPUT_URL);

    // INICIAR LOADING IMEDIATAMENTE (sem esperar resposta)
    onStartProcessing(newSessionId);
    setIsSubmitting(false);

    // Processar resposta em background (não bloqueia a UI)
    (async () => {
      try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Enviar para webhook de ENTRADA do n8n (não esperamos resposta síncrona)
      const response = await fetch(WEBHOOK_INPUT_URL, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("Resposta do webhook de entrada:", response.status);
      const contentType = response.headers.get("content-type") || "";
      console.log("Content-Type:", contentType);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao processar documentos: ${response.status} - ${errorText}`);
      }

      // Verificar se a resposta é HTML (resposta síncrona direta do n8n)
      if (contentType.includes("text/html") || contentType.includes("application/octet-stream")) {
        console.log("Recebendo resposta HTML direta do n8n");
        
        // Receber o HTML como blob
        const blob = await response.blob();
        console.log("Blob recebido:", blob.size, "bytes, tipo:", blob.type);

        if (blob.size === 0) {
          throw new Error("Resposta vazia do servidor");
        }

        // Sucesso - enviar blob diretamente para o componente pai
        onSuccess(blob);
        return;
      }

      // Se não for HTML, assumir que é JSON (resposta assíncrona)
      try {
        const result = await response.json();
        console.log("Resposta JSON recebida:", result);

        // Se a resposta indica que o processamento foi iniciado mas não está completo
        // O loading já foi iniciado acima, então apenas continuar (polling já está ativo)
        if (!(result.status === "processing" || result.message || result.success)) {
          // Se já veio completo (improvável, mas possível)
          throw new Error("Formato de resposta inesperado do servidor");
        }
        // Se for assíncrono, o polling no Index já está ativo, então não fazer nada
      } catch (jsonError) {
        // Se não conseguir fazer parse como JSON, pode ser que seja HTML mesmo
        console.warn("Não foi possível fazer parse como JSON, tentando como HTML...");
        const blob = await response.blob();
        if (blob.size > 0) {
          onSuccess(blob);
          return;
        }
        throw jsonError;
      }
      
    } catch (err: unknown) {
      console.error("Erro ao processar resposta:", err);
      
      let message = "Erro ao processar análise";
      
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          message = "Tempo limite excedido. Por favor, tente novamente.";
        } else {
          message = err.message;
        }
      }
      
      onError(message);
    }
    })(); // Executar função assíncrona em background
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <section id="upload" className="py-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <form onSubmit={handleSubmit}>
            <div className="card-elevated p-8 md:p-10">
              <h2 className="text-2xl font-bold text-center mb-2">
                Envie suas cotações
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                Faça upload dos PDFs das cotações D&O para análise comparativa
              </p>

              {/* Drop Zone */}
              <div
                onClick={openFileDialog}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <motion.div
                  animate={{ scale: isDragging ? 1.1 : 1 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center"
                >
                  <Upload className="w-8 h-8 text-primary" />
                </motion.div>

                <p className="text-lg font-medium mb-2">
                  Arraste e solte seus arquivos aqui
                </p>
                <p className="text-muted-foreground text-sm">
                  ou clique para selecionar
                </p>
                <p className="text-muted-foreground/70 text-xs mt-2">
                  PDF • Máx. 10MB por arquivo • Até {MAX_FILES} arquivos
                </p>
              </div>

              {/* File List */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {files.length}{" "}
                        {files.length === 1 ? "arquivo" : "arquivos"}{" "}
                        selecionado{files.length !== 1 ? "s" : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles([])}
                        className="text-destructive hover:underline"
                      >
                        Remover todos
                      </button>
                    </div>

                    {files.map((file, index) => (
                      <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="w-8 h-8 rounded-lg hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <div className="mt-8">
                <Button
                  type="submit"
                  size="lg"
                  disabled={files.length === 0 || isSubmitting}
                  className="w-full gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Analisar Cotações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default UploadZone;
