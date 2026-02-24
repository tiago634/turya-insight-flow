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
// Enviamos multipart/form-data: arquivos como binário (sem base64), campos como form fields.
app.post('/api/send-to-n8n', upload.any(), async (req, res) => {
  try {
    console.log('📤 Recebendo documentos do frontend para enviar ao n8n...');
    
    const formData = new FormData();
    
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        formData.append(key, req.body[key]);
      });
    }
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        formData.append(file.fieldname, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
      });
    }
    
    const headers = formData.getHeaders();
    let bodyBuffer;
    try {
      bodyBuffer = formData.getBuffer();
    } catch (bufErr) {
      console.error('❌ Erro ao montar multipart:', bufErr.message);
      return res.status(500).json({ error: 'Erro ao preparar envio dos arquivos.' });
    }
    
    if (!bodyBuffer || bodyBuffer.length < 50) {
      console.error('❌ Multipart muito pequeno:', bodyBuffer?.length, '- req.files:', req.files?.length, 'req.body keys:', req.body ? Object.keys(req.body) : []);
      return res.status(500).json({ error: 'Falha ao montar os arquivos para envio.' });
    }
    
    const sessionId = req.body?.session_id || null;
    console.log('📤 Enviando para n8n (multipart,', bodyBuffer.length, 'bytes,', req.files?.length || 0, 'arquivos), session_id:', sessionId);
    
    // Não esperar a resposta do n8n: o fluxo pode levar vários minutos (ex.: 4–5 min).
    // Retornamos sucesso na hora. Quando o n8n responder (Respond to Webhook), lemos o HTML em background
    // e gravamos em analysisResults para o polling do frontend encontrar.
    fetch(N8N_WEBHOOK_INPUT_URL, {
      method: 'POST',
      body: bodyBuffer,
      headers: {
        'Content-Type': headers['content-type'],
        'Content-Length': String(bodyBuffer.length)
      }
    })
      .then(async (response) => {
        console.log('📥 Resposta do n8n (background):', response.status);
        if (!response.ok) {
          const t = await response.text();
          console.error('⚠️ n8n retornou:', response.status, t?.slice(0, 300));
          // 524 (Cloudflare timeout) e 504: não gravar como erro – o fluxo pode ainda estar rodando
          // e enviar o resultado via POST /webhook/result quando terminar. Frontend continua em polling.
          const isTimeout = response.status === 524 || response.status === 504;
          if (sessionId && !isTimeout) {
            analysisResults.set(sessionId, { session_id: sessionId, status: 'error', error: `n8n retornou ${response.status}` });
          } else if (sessionId && isTimeout) {
            console.log('⏳ Timeout na conexão (524/504); aguardando resultado via /webhook/result se o fluxo enviar.');
          }
          return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (sessionId && (contentType.includes('text/html') || contentType.includes('application/octet-stream'))) {
          const buf = await response.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          analysisResults.set(sessionId, {
            session_id: sessionId,
            html_content: base64,
            status: 'completed',
            received_at: new Date().toISOString()
          });
          console.log('✅ Resultado gravado para session_id:', sessionId, '(Respond to Webhook)');
        } else if (sessionId) {
          const text = await response.text();
          if (text && text.length < 5000) {
            try {
              const json = JSON.parse(text);
              if (json.session_id) analysisResults.set(json.session_id, { ...json, received_at: new Date().toISOString() });
            } catch (_) {}
          }
        }
      })
      .catch((err) => {
        console.error('⚠️ Erro ao enviar para n8n (background):', err.message);
        if (sessionId) {
          analysisResults.set(sessionId, { session_id: sessionId, status: 'error', error: err.message });
        }
      });

    // Resposta imediata: fluxo em processamento; quando n8n responder, o polling encontra o resultado.
    res.json({
      success: true,
      message: 'Documentos enviados para análise. O processamento pode levar alguns minutos; aguarde na tela de carregamento.'
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
    console.log('📥 ========== RECEBENDO RESULTADO DO N8N ==========');
    console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📥 Body completo:', JSON.stringify(req.body, null, 2));
    console.log('📥 Files:', req.files ? req.files.map(f => ({ name: f.originalname, size: f.size })) : 'Nenhum arquivo');
    console.log('📥 Content-Type:', req.headers['content-type']);

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
      console.error('❌ session_id não encontrado no resultado do n8n');
      console.error('❌ Body keys:', Object.keys(req.body || {}));
      console.error('❌ Body completo:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ 
        error: 'session_id é obrigatório',
        received: Object.keys(req.body || {}),
        hint: 'Certifique-se de que o n8n está enviando o session_id no corpo da requisição'
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
    console.log(`🔍 Polling: session_id ${sessionId} ainda não recebeu resultado do n8n`);
    console.log(`🔍 Total de resultados armazenados: ${analysisResults.size}`);
    console.log(`🔍 Session IDs armazenados:`, Array.from(analysisResults.keys()));
    return res.json({ 
      status: 'processing', 
      session_id: sessionId 
    });
  }

  console.log(`✅ Polling: resultado encontrado para session_id ${sessionId}`);
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
