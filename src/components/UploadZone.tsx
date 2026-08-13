import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, FileText, Loader2, Send, Upload, X } from "lucide-react";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { useTermsGate } from "@/hooks/useTermsGate";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["application/pdf"];

const UploadZone = () => {
  const { submitDocuments } = useAnalysisFlow();
  const { termsAccepted, requestTermsAcceptance } = useTermsGate();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingTerms, setIsWaitingTerms] = useState(false);
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

    setError(null);

    // Primeiro envio desta sessão: precisa aceitar os termos.
    if (!termsAccepted) {
      try {
        setIsWaitingTerms(true);
        const ok = await requestTermsAcceptance();
        if (!ok) return;
      } finally {
        setIsWaitingTerms(false);
      }
    }

    setIsSubmitting(true);
    submitDocuments(files);
    setIsSubmitting(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <section
      id="upload"
      className="relative isolate flex flex-col items-center px-6 py-[84px] text-center md:py-[130px]"
    >
      <div className="mx-auto w-full max-w-[1040px]">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[760px]">
          <div className="w-full rounded-[22px] border border-[rgba(255,180,110,.16)] bg-[rgba(18,12,28,.5)] px-[22px] py-[30px] shadow-[0_30px_80px_rgba(0,0,0,.5),0_0_50px_rgba(234,100,36,.08)] md:px-9 md:py-10">
            <div className="eyebrow-turya mb-4">comece agora</div>
            <h2 className="text-[clamp(24px,3vw,32px)] font-extralight leading-[1.25] tracking-[-0.5px]">
              Envie suas <span className="text-grad">cotações</span>
            </h2>
            <p className="mx-auto mt-2.5 text-[15px] font-light text-white/80">
              Faça upload dos PDFs das cotações D&amp;O para a análise comparativa
            </p>

            <div
              onClick={openFileDialog}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-[30px] cursor-pointer rounded-[18px] border-2 border-dashed px-6 py-11 transition-all ${
                isDragging
                  ? "border-[rgba(255,180,110,.55)] bg-[rgba(234,100,36,.06)]"
                  : "border-[rgba(150,165,190,.25)] bg-white/[.03] hover:border-[rgba(255,180,110,.55)] hover:bg-[rgba(234,100,36,.06)]"
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

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(234,100,36,.15)]">
                <Upload className="h-7 w-7 text-turya-orange" />
              </div>

              <p className="mb-1.5 text-[17px] font-normal">Arraste e solte seus arquivos aqui</p>
              <p className="text-[13px] text-white/68">ou clique para selecionar</p>
              <p className="mt-2.5 text-[11.5px] text-white/45">
                PDF · Máx. 10MB por arquivo · Até {MAX_FILES} arquivos
              </p>
            </div>

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-3 text-left"
                >
                  <div className="flex items-center justify-between text-sm text-white/68">
                    <span>
                      {files.length} {files.length === 1 ? "arquivo" : "arquivos"} selecionado
                      {files.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-turya-orange hover:underline"
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
                      className="flex items-center gap-3 rounded-xl border border-[rgba(255,180,110,.16)] bg-white/[.04] p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(234,100,36,.15)]">
                        <FileText className="h-5 w-5 text-turya-orange" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="text-xs text-white/68">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/68 transition-colors hover:bg-[rgba(234,100,36,.2)] hover:text-turya-orange"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(234,100,36,.35)] bg-[rgba(234,100,36,.1)] p-3 text-turya-gold"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={files.length === 0 || isSubmitting || isWaitingTerms}
              className="btn-solid"
            >
              {isWaitingTerms ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirmando termos...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Analisar Cotações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default UploadZone;
