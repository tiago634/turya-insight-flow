import { motion } from "framer-motion";
import { FileText, Download, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadReportProps {
  htmlBlob: Blob;
  onReset: () => void;
}

const DownloadReport = ({ htmlBlob, onReset }: DownloadReportProps) => {
  const handleDownload = () => {
    const url = window.URL.createObjectURL(htmlBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Analise_DO.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="card-elevated p-8 md:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-green-500/20 flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-green-400" />
            </motion.div>

            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-4"
            >
              Análise concluída!
            </motion.h3>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-8 max-w-md mx-auto"
            >
              O relatório comparativo das suas cotações D&O foi gerado com sucesso.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-4 p-6 rounded-xl bg-primary/10 border border-primary/20 mb-8"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Analise_DO.html</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(htmlBlob.size)}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={handleDownload}
                size="lg"
                className="gap-2"
              >
                <Download className="w-5 h-5" />
                Baixar Relatório
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Enviar outras cotações
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DownloadReport;
