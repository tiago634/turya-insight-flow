// Servidor simples para receber webhook de saída do n8n
// Armazena resultados em memória (não persiste entre reinicializações)

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
// Node.js 18+ tem fetch nativo, não precisa de node-fetch
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

// URL do webhook de entrada do n8n
const N8N_WEBHOOK_INPUT_URL = process.env.N8N_WEBHOOK_INPUT_URL || 'https://wgatech.app.n8n.cloud/webhook/219cc658-bea9-4cb9-b463-9ead6f8cdc21';

// Endpoint PROXY para enviar documentos ao n8n (resolve problema de CORS)
app.post('/api/send-to-n8n', upload.any(), async (req, res) => {
  try {
    console.log('📤 Recebendo documentos do frontend para enviar ao n8n...');
    
    // Criar FormData para encaminhar ao n8n
    const formData = new FormData();
    
    // Copiar todos os campos do FormData recebido
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        formData.append(key, req.body[key]);
      });
    }
    
    // Copiar todos os arquivos
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        formData.append(file.fieldname, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
      });
    }
    
    console.log('📤 Enviando para n8n:', N8N_WEBHOOK_INPUT_URL);
    
    // IMPORTANTE: Retornar sucesso IMEDIATAMENTE após iniciar o envio
    // O n8n processará em background e enviará o resultado via webhook de saída
    // Não esperamos a resposta completa para evitar timeout (524)
    
    // Enviar para o n8n sem aguardar resposta completa (fire-and-forget)
    fetch(N8N_WEBHOOK_INPUT_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    })
    .then(response => {
      console.log('📥 Resposta do n8n (background):', response.status);
      if (!response.ok) {
        console.error('⚠️ n8n retornou status:', response.status);
        // Não lançamos erro aqui porque já retornamos sucesso ao cliente
      }
    })
    .catch(error => {
      console.error('⚠️ Erro ao enviar para n8n (background):', error.message);
      // Não lançamos erro aqui porque já retornamos sucesso ao cliente
    });
    
    // Retornar sucesso IMEDIATAMENTE (não esperar processamento do n8n)
    // O frontend já está fazendo polling para verificar quando o resultado está pronto
    res.json({
      success: true,
      message: 'Documentos enviados para análise com sucesso. Processando em background...'
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar para n8n:', error);
    res.status(500).json({
      error: error.message || 'Erro ao enviar documentos para análise'
    });
  }
});

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
  console.log(`🔗 URL do n8n configurada: ${N8N_WEBHOOK_INPUT_URL}`);
  console.log(`⚠️  Verifique se a URL está correta (deve ser /webhook/ e não /webhook-test/)`);
});
