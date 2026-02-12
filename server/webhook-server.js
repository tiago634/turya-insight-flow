// Servidor simples para receber webhook de saída do n8n
// Armazena resultados em memória (não persiste entre reinicializações)

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3001;

// Armazenamento em memória (em produção, considere usar Redis ou similar)
const analysisResults = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar multer para FormData
const upload = multer();

// Endpoint para receber resultado do n8n (webhook de saída)
app.post('/webhook/result', upload.any(), async (req, res) => {
  try {
    console.log('📥 Recebendo resultado do n8n...');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    let sessionId = null;
    let htmlContent = null;
    let status = 'completed';
    let error = null;

    // Tentar obter dados de diferentes formatos
    if (req.body.session_id) {
      sessionId = req.body.session_id;
    } else if (req.body.sessionId) {
      sessionId = req.body.sessionId;
    }

    if (req.body.html_content) {
      htmlContent = req.body.html_content;
    } else if (req.body.htmlContent) {
      htmlContent = req.body.htmlContent;
    } else if (req.body.html) {
      // Se vier como string HTML, converter para base64
      htmlContent = Buffer.from(req.body.html).toString('base64');
    }

    if (req.body.status) {
      status = req.body.status;
    }

    if (req.body.error) {
      error = req.body.error;
    }

    // Verificar se veio como arquivo
    if (req.files && req.files.length > 0) {
      const htmlFile = req.files.find(f => 
        f.fieldname === 'html_file' || 
        f.fieldname === 'html' || 
        f.originalname.endsWith('.html')
      );
      
      if (htmlFile) {
        htmlContent = htmlFile.buffer.toString('base64');
      }
    }

    // Verificar session_id nos campos do FormData
    if (!sessionId && req.body) {
      sessionId = req.body.session_id || req.body.sessionId;
    }

    if (!sessionId) {
      console.error('❌ session_id não encontrado');
      return res.status(400).json({ 
        error: 'session_id é obrigatório',
        received: Object.keys(req.body || {})
      });
    }

    // Armazenar resultado
    analysisResults.set(sessionId, {
      session_id: sessionId,
      html_content: htmlContent,
      status: status,
      error: error,
      received_at: new Date().toISOString()
    });

    console.log(`✅ Resultado salvo para session_id: ${sessionId}`);
    console.log(`   Status: ${status}`);
    console.log(`   HTML size: ${htmlContent ? htmlContent.length : 0} bytes`);

    res.json({ 
      success: true, 
      session_id: sessionId,
      message: 'Resultado recebido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao processar webhook'
    });
  }
});

// Endpoint para verificar status (polling do frontend)
app.get('/api/analysis/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'session_id é obrigatório' });
  }

  const result = analysisResults.get(sessionId);

  if (!result) {
    return res.json({ 
      status: 'processing', 
      session_id: sessionId 
    });
  }

  res.json(result);
});

// Endpoint para limpar resultados antigos (opcional)
app.delete('/api/analysis/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  analysisResults.delete(sessionId);
  res.json({ success: true, message: 'Resultado removido' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stored_results: analysisResults.size
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor webhook rodando na porta ${PORT}`);
  console.log(`📡 Webhook de saída: http://0.0.0.0:${PORT}/webhook/result`);
  console.log(`🔍 Status check: http://0.0.0.0:${PORT}/api/analysis/:sessionId`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
