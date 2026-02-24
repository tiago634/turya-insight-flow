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
// Enviamos como JSON para o n8n preencher body (multipart no n8n cloud às vezes deixa body vazio)
app.post('/api/send-to-n8n', upload.any(), async (req, res) => {
  try {
    console.log('📤 Recebendo documentos do frontend para enviar ao n8n...');
    
    const payload = { ...req.body };
    
    // Incluir arquivos em base64 para o body do n8n vir preenchido
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, i) => {
        payload[file.fieldname] = file.buffer.toString('base64');
        payload[`${file.fieldname}_filename`] = file.originalname;
        payload[`${file.fieldname}_mimetype`] = file.mimetype;
      });
    }
    
    console.log('📤 Enviando para n8n (JSON):', N8N_WEBHOOK_INPUT_URL);
    
    // Esperar o n8n ACEITAR o request (até 15s) antes de devolver sucesso ao site.
    // Assim os documentos realmente entram no fluxo. O resultado virá depois via webhook de saída + polling.
    const N8N_ACCEPT_TIMEOUT_MS = 15000; // 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), N8N_ACCEPT_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(N8N_WEBHOOK_INPUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const isTimeout = fetchError.name === 'AbortError';
      console.error(isTimeout ? '⚠️ Timeout aguardando n8n (15s) - documentos podem não ter entrado no fluxo' : '⚠️ Erro ao enviar para n8n:', fetchError.message);
      return res.status(504).json({
        error: isTimeout
          ? 'O n8n demorou para responder. Tente novamente ou verifique se o fluxo está ativo.'
          : `Erro ao enviar para n8n: ${fetchError.message}`
      });
    }

    clearTimeout(timeoutId);

    console.log('📥 Resposta do n8n:', response.status, response.status === 200 ? '- documentos recebidos pelo fluxo' : '- verifique o fluxo no n8n');

    if (!response.ok) {
      const errText = await response.text();
      console.error('⚠️ n8n retornou:', response.status, errText);
      return res.status(502).json({
        error: `n8n retornou ${response.status}. Os documentos podem não ter entrado no fluxo.`,
        details: errText.slice(0, 500)
      });
    }

    // n8n aceitou; o fluxo vai rodar e enviar o resultado para /webhook/result. O site faz polling.
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
