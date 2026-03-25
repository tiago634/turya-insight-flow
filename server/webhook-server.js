// Servidor simples para receber webhook de saída do n8n
// Armazena resultados em Redis (compartilhado entre instâncias no Railway) ou em memória

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
// Node.js 18+ tem fetch nativo, não precisa de node-fetch
const app = express();
const PORT = process.env.PORT || 3001;

// Railway pode expor REDIS_URL ou REDIS_PUBLIC_URL; aceitamos os dois
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL;
const PREFIX = 'analysis:';

// Store compartilhado: Redis se REDIS_URL existir (várias instâncias Railway), senão Map (local)
let redisClient = null;
const memoryMap = new Map();

async function storeGet(sessionId) {
  if (redisClient) {
    const raw = await redisClient.get(PREFIX + sessionId);
    return raw ? JSON.parse(raw) : null;
  }
  return memoryMap.get(sessionId) ?? null;
}

async function storeSet(sessionId, data) {
  if (redisClient) {
    await redisClient.set(PREFIX + sessionId, JSON.stringify(data));
    return;
  }
  memoryMap.set(sessionId, data);
}

async function storeDelete(sessionId) {
  if (redisClient) {
    await redisClient.del(PREFIX + sessionId);
    return;
  }
  memoryMap.delete(sessionId);
}

async function storeSize() {
  if (redisClient) {
    const keys = await redisClient.keys(PREFIX + '*');
    return keys.length;
  }
  return memoryMap.size;
}

async function storeKeys() {
  if (redisClient) {
    const keys = await redisClient.keys(PREFIX + '*');
    return keys.map(k => k.slice(PREFIX.length));
  }
  return Array.from(memoryMap.keys());
}

/** Após base64, distingue HTML principal de planilha (n8n pode enviar os dois em POSTs separados no mesmo campo). */
function detectPayloadKindFromBase64(base64Str) {
  if (!base64Str || typeof base64Str !== 'string') return 'unknown';
  try {
    const normalized = base64Str.replace(/^data:.*,/, '').trim();
    const buf = Buffer.from(normalized, 'base64');
    if (buf.length < 4) return 'unknown';
    if (buf[0] === 0x50 && buf[1] === 0x4b) return 'xlsx';
    if (buf.length >= 8 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) return 'xls';
    const head = buf.slice(0, Math.min(512, buf.length)).toString('utf8').trimStart();
    if (head.startsWith('<!') || head.startsWith('<html') || head.startsWith('<HTML')) return 'html';
    if (head.startsWith('<')) return 'html';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Um único POST multipart pode trazer HTML + XLS com o mesmo fieldname ("data").
 * Acumulamos candidatos e escolhemos: HTML = base64 mais longo entre os que são HTML;
 * planilha = por assinatura/nome ou o binário menor quando há dois "data" opacos.
 */
function collectWebhookPayloads(req) {
  const htmlCandidates = [];
  const sheetCandidates = [];
  const opaqueParts = [];

  const addSheet = (b64) => {
    if (b64 && typeof b64 === 'string' && b64.trim()) sheetCandidates.push(b64.trim());
  };
  const addHtml = (b64) => {
    if (b64 && typeof b64 === 'string' && b64.trim()) htmlCandidates.push(b64.trim());
  };

  if (req.body.html_content) {
    const k = detectPayloadKindFromBase64(req.body.html_content);
    if (k === 'xlsx' || k === 'xls') addSheet(req.body.html_content);
    else addHtml(req.body.html_content);
  } else if (req.body.htmlContent) {
    const k = detectPayloadKindFromBase64(req.body.htmlContent);
    if (k === 'xlsx' || k === 'xls') addSheet(req.body.htmlContent);
    else addHtml(req.body.htmlContent);
  }
  if (req.body.html && typeof req.body.html === 'string' && req.body.html.length > 0) {
    addHtml(Buffer.from(req.body.html, 'utf8').toString('base64'));
  }

  addSheet(req.body.xlsx_content);
  addSheet(req.body.xls_content);
  addSheet(req.body.Analise_Turya_XLSX);

  for (const f of req.files || []) {
    const b64 = f.buffer.toString('base64');
    const name = (f.originalname || '').toLowerCase();
    const field = (f.fieldname || '').toLowerCase();
    const kind = detectPayloadKindFromBase64(b64);

    const forceSheet =
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.includes('analise_turya') ||
      field.includes('xls') ||
      field.includes('xlsx') ||
      field.includes('excel') ||
      field.includes('spreadsheet');
    const forceHtml = name.endsWith('.html') || field === 'html_file' || field === 'html';

    if (forceSheet) {
      addSheet(b64);
      continue;
    }
    if (forceHtml) {
      addHtml(b64);
      continue;
    }
    if (kind === 'xlsx' || kind === 'xls') {
      addSheet(b64);
      continue;
    }
    if (kind === 'html') {
      addHtml(b64);
      continue;
    }

    // Mesmo fieldname "data" para os dois binários: guardar e decidir depois (maior = HTML, menor = planilha).
    if (field === 'data' || field === 'file' || field === 'attachment') {
      opaqueParts.push(b64);
      continue;
    }

    if (kind === 'unknown') {
      opaqueParts.push(b64);
    } else {
      addHtml(b64);
    }
  }

  if (opaqueParts.length >= 2) {
    opaqueParts.sort((a, b) => b.length - a.length);
    addHtml(opaqueParts[0]);
    addSheet(opaqueParts[1]);
  } else if (opaqueParts.length === 1) {
    const one = opaqueParts[0];
    const k = detectPayloadKindFromBase64(one);
    if (k === 'xlsx' || k === 'xls') addSheet(one);
    else if (k === 'html') addHtml(one);
    else if (one.length > 800000) addHtml(one);
    else addSheet(one);
  }

  const htmlContent = htmlCandidates.reduce((best, cur) => (!best || cur.length > best.length ? cur : best), null);
  const spreadsheetFromFiles = sheetCandidates.length ? sheetCandidates[sheetCandidates.length - 1] : null;

  return { htmlContent, spreadsheetFromFiles, _debug: { nHtmlCand: htmlCandidates.length, nSheetCand: sheetCandidates.length } };
}

// Limite de body grande para receber HTML em base64 ou arquivo no /webhook/result
const BODY_LIMIT = '50mb';

// Middleware
app.use(cors());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Multer: aceitar arquivos grandes no /webhook/result
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB

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
            storeSet(sessionId, { session_id: sessionId, status: 'error', error: `n8n retornou ${response.status}` }).catch(e => console.error('storeSet error:', e));
          } else if (sessionId && isTimeout) {
            console.log('⏳ Timeout na conexão (524/504); aguardando resultado via /webhook/result se o fluxo enviar.');
          }
          return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (sessionId && (contentType.includes('text/html') || contentType.includes('application/octet-stream'))) {
          const buf = await response.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          storeGet(sessionId)
            .then((existing) => {
              const ex = existing || {};
              const merged = {
                session_id: sessionId,
                status: 'completed',
                received_at: new Date().toISOString(),
                html_content: base64,
                xlsx_content: ex.xlsx_content || null,
                Analise_Turya_XLSX: ex.Analise_Turya_XLSX || null,
                error: ex.error
              };
              if (ex.html_content && ex.html_content.length > base64.length) {
                merged.html_content = ex.html_content;
              }
              return storeSet(sessionId, merged);
            })
            .catch(e => console.error('storeSet error:', e));
          console.log('✅ Resultado gravado para session_id:', sessionId, '(Respond to Webhook)');
        } else if (sessionId) {
          const text = await response.text();
          if (text && text.length < 5000) {
            try {
              const json = JSON.parse(text);
              if (json.session_id) storeSet(json.session_id, { ...json, received_at: new Date().toISOString() }).catch(e => console.error('storeSet error:', e));
            } catch (_) {}
          }
        }
      })
      .catch((err) => {
        console.error('⚠️ Erro ao enviar para n8n (background):', err.message);
        if (sessionId) {
          storeSet(sessionId, { session_id: sessionId, status: 'error', error: err.message }).catch(e => console.error('storeSet error:', e));
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
    let status = 'completed';
    let error = null;

    if (req.body.session_id) {
      sessionId = req.body.session_id;
    } else if (req.body.sessionId) {
      sessionId = req.body.sessionId;
    }

    if (req.body.status) {
      status = req.body.status;
    }

    if (req.body.error) {
      error = req.body.error;
    }

    const { htmlContent, spreadsheetFromFiles, _debug } = collectWebhookPayloads(req);
    console.log(
      '📊 Coleta (um POST pode ter 2 arquivos):',
      _debug.nHtmlCand,
      'candidato(s) HTML,',
      _debug.nSheetCand,
      'candidato(s) planilha | files:',
      req.files?.length ?? 0
    );

    // Verificar session_id nos campos do FormData
    if (!sessionId && req.body) {
      sessionId = req.body.session_id || req.body.sessionId;
    }

    // Normalizar: n8n pode enviar com espaço/newline; frontend faz polling sem. Chave no Redis deve bater.
    sessionId = typeof sessionId === 'string' ? sessionId.trim() : String(sessionId || '').trim();

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

    console.log(`🔑 session_id recebido do n8n: ${sessionId}`);
    console.log(`🔑 O frontend DEVE estar fazendo polling com este mesmo ID. Se a tela mostrar outro ID, corrija no n8n a expressão do campo session_id no nó HTTP Request (use o primeiro Webhook: $('NomeDoWebhook').first().json.body.session_id).`);

    // Campo "html_content" pode trazer na verdade XLS/XLSX (segundo POST do n8n)
    if (htmlContent) {
      const k = detectPayloadKindFromBase64(htmlContent);
      if (k === 'xlsx' || k === 'xls') {
        spreadsheetFromFiles = htmlContent;
        htmlContent = null;
      }
    }

    const existing = (await storeGet(sessionId)) || {};

    const merged = {
      session_id: sessionId,
      status: status || existing.status || 'completed',
      error: error !== undefined && error !== null ? error : existing.error,
      received_at: new Date().toISOString(),
      html_content: existing.html_content || null,
      xlsx_content: existing.xlsx_content || null,
      Analise_Turya_XLSX: existing.Analise_Turya_XLSX || null
    };

    if (htmlContent && typeof htmlContent === 'string' && htmlContent.length > 0) {
      const k = detectPayloadKindFromBase64(htmlContent);
      if (k === 'html') {
        if (!merged.html_content || htmlContent.length > merged.html_content.length) {
          merged.html_content = htmlContent;
        }
      } else if (k === 'xlsx' || k === 'xls') {
        merged.xlsx_content = htmlContent;
        merged.Analise_Turya_XLSX = htmlContent;
      }
    }

    if (spreadsheetFromFiles && typeof spreadsheetFromFiles === 'string' && spreadsheetFromFiles.length > 0) {
      merged.xlsx_content = spreadsheetFromFiles;
      merged.Analise_Turya_XLSX = spreadsheetFromFiles;
    }

    const hasHtmlAfter = !!(merged.html_content && merged.html_content.length > 0);
    const hasSheetAfter = !!(merged.xlsx_content && merged.xlsx_content.length > 0);

    if (!hasHtmlAfter && !hasSheetAfter) {
      console.error('❌ Nenhum arquivo útil após merge. Content-Type:', req.headers['content-type']);
      console.error('❌ req.files:', req.files?.length ?? 0, req.files ? req.files.map(f => ({ field: f.fieldname, size: f.size })) : []);
      console.error('❌ req.body keys:', Object.keys(req.body || {}));
      return res.status(400).json({
        success: false,
        error: 'Nenhum HTML nem planilha recebidos',
        hint: 'Envie session_id e o arquivo (multipart ou html_content em base64).'
      });
    }

    // Só planilha ainda (n8n envia antes do HTML): grava no Redis e mantém processing para o polling continuar.
    if (!hasHtmlAfter && hasSheetAfter) {
      merged.status = 'processing';
    } else if (hasHtmlAfter) {
      merged.status = status && String(status).length ? status : 'completed';
    }

    await storeSet(sessionId, merged);

    const htmlLen = merged.html_content ? merged.html_content.length : 0;
    const sheetLen = merged.xlsx_content ? merged.xlsx_content.length : 0;
    console.log(`✅ Resultado salvo (merge) para session_id: ${sessionId}`);
    console.log(`   Status: ${merged.status}`);
    console.log(`   HTML base64 length: ${htmlLen} | Planilha base64 length: ${sheetLen || '(nenhuma ainda)'}`);
    if (redisClient) console.log(`   Store: Redis (key ${PREFIX}${sessionId})`);

    res.json({
      success: true,
      session_id: sessionId,
      message: 'Resultado recebido com sucesso',
      html_received_bytes: htmlLen,
      spreadsheet_received_bytes: sheetLen
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ 
      error: error.message || 'Erro ao processar webhook'
    });
  }
});

// Endpoint para verificar status (polling do frontend)
// Headers anti-cache: evita 304 e garante que o frontend sempre receba a resposta atual (completed/processing)
const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

app.get('/api/analysis/:sessionId', async (req, res) => {
  const sessionId = (req.params.sessionId || '').trim();

  res.set(noCacheHeaders);

  if (!sessionId) {
    return res.status(400).json({ error: 'session_id é obrigatório' });
  }

  let result = await storeGet(sessionId);

  // Fallback: chave pode ter sido gravada com espaço/newline pelo n8n; buscar por match com trim
  if (!result) {
    const keys = await storeKeys();
    const matchedKey = keys.find(k => String(k).trim() === sessionId);
    if (matchedKey != null) {
      result = await storeGet(matchedKey);
      if (result) console.log(`🔑 Polling: resultado encontrado via fallback (chave com trim): ${sessionId}`);
    }
  }

  if (!result) {
    const total = await storeSize();
    const keys = await storeKeys();
    console.log(`🔍 Polling: session_id ${sessionId} ainda não recebeu resultado do n8n`);
    console.log(`🔍 Total de resultados armazenados: ${total}`);
    console.log(`🔍 Session IDs armazenados:`, keys);
    return res.json({ 
      status: 'processing', 
      session_id: sessionId 
    });
  }

  const hasHtml = !!(result.html_content && result.html_content.length > 0);
  const sheetB64 = result.xlsx_content || result.Analise_Turya_XLSX || null;
  const hasSheet = !!(sheetB64 && sheetB64.length > 0);
  console.log(
    `✅ Polling: session_id ${sessionId}, hasHtml: ${hasHtml}, html length: ${result.html_content?.length ?? 0}` +
      (hasSheet ? `, planilha length: ${sheetB64.length}` : ', sem planilha no store')
  );

  // Sem HTML ainda: nunca devolver "completed" (senão o front fecha antes da planilha/HTML final).
  const effectiveStatus = hasHtml ? 'completed' : 'processing';

  // Resposta: html_content + campos que o frontend usa para extrair XLS/XLSX
  const payload = {
    session_id: result.session_id || sessionId,
    status: effectiveStatus,
    html_content: result.html_content || null,
    xlsx_content: result.xlsx_content || null,
    Analise_Turya_XLSX: result.Analise_Turya_XLSX || result.xlsx_content || null,
    error: result.error || null,
    received_at: result.received_at || null
  };
  res.json(payload);
});

// Endpoint para limpar resultados antigos (opcional)
app.delete('/api/analysis/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  await storeDelete(sessionId);
  res.json({ success: true, message: 'Resultado removido' });
});

// Health check
app.get('/health', async (req, res) => {
  const total = await storeSize();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stored_results: total
  });
});

// Diagnóstico: descobrir por que o frontend não recebe o resultado
app.get('/api/debug', async (req, res) => {
  res.set(noCacheHeaders);
  const keys = await storeKeys();
  res.json({
    redis_connected: !!redisClient,
    stored_results_count: keys.length,
    session_ids: keys,
    hint: keys.length === 0 ? 'Nenhum resultado gravado. O n8n já enviou POST /webhook/result com sucesso (200)?' : 'Teste GET /api/debug/session/SEU_SESSION_ID'
  });
});

app.get('/api/debug/session/:sessionId', async (req, res) => {
  res.set(noCacheHeaders);
  const sessionId = (req.params.sessionId || '').trim();
  if (!sessionId) return res.status(400).json({ error: 'sessionId é obrigatório' });
  const result = await storeGet(sessionId);
  const found = !!result;
  const hasHtml = found && !!(result.html_content && result.html_content.length > 0);
  const payload = {
    session_id: sessionId,
    found,
    has_html: hasHtml,
    status: result?.status ?? null,
    store: redisClient ? 'redis' : 'memory',
    hint: !found ? 'Resultado não encontrado. n8n enviou o POST /webhook/result com este session_id? Verifique os logs do Railway no momento em que o fluxo terminou.' : (hasHtml ? 'Backend tem o HTML. Se o frontend não exibe, verifique cache ou resposta do GET /api/analysis/' + sessionId : 'Resultado existe mas sem html_content. n8n deve enviar o arquivo no campo "data" (Form-Data).')
  };
  if (!found) {
    const keys = await storeKeys();
    payload.stored_session_ids = keys;
    payload.match_hint = keys.length === 0 ? 'Nenhum resultado no store.' : (keys.includes(sessionId) ? 'Este session_id está na lista mas storeGet retornou null (bug?).' : 'Este session_id não está na lista. Confira se o frontend usa o mesmo ID que o n8n enviou no POST.');
  }
  res.json(payload);
});

async function startServer() {
  if (REDIS_URL) {
    try {
      const { createClient } = require('redis');
      redisClient = createClient({ url: REDIS_URL });
      redisClient.on('error', (err) => console.error('Redis error:', err.message));
      await redisClient.connect();
      console.log('📦 Redis conectado (resultados compartilhados entre instâncias)');
    } catch (err) {
      console.error('❌ Redis falhou, usando memória local:', err.message);
      redisClient = null;
    }
  } else {
    console.log('📦 Armazenamento em memória (defina REDIS_URL ou REDIS_PUBLIC_URL no Railway para múltiplas instâncias)');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor webhook rodando na porta ${PORT}`);
    console.log(`📡 Webhook de saída: http://0.0.0.0:${PORT}/webhook/result`);
    console.log(`🔍 Status check: http://0.0.0.0:${PORT}/api/analysis/:sessionId`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL do n8n configurada: ${N8N_WEBHOOK_INPUT_URL}`);
    console.log(`⚠️  Verifique se a URL está correta (deve ser /webhook/ e não /webhook-test/)`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
