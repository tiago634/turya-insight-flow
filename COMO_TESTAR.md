# 🧪 Como Testar o Sistema

## Pré-requisitos

1. Node.js instalado
2. ngrok instalado (para expor servidor local)
   - Download: https://ngrok.com/download
   - Ou instale via npm: `npm install -g ngrok`

## Passo a Passo para Testar

### 1️⃣ Instalar Dependências

```bash
npm install
cd server
npm install
cd ..
```

### 2️⃣ Iniciar o Servidor Webhook (Terminal 1)

```bash
npm run dev:server
```

Você deve ver:
```
🚀 Servidor webhook rodando na porta 3001
📡 Webhook de saída: http://localhost:3001/webhook/result
🔍 Status check: http://localhost:3001/api/analysis/:sessionId
```

**Deixe este terminal aberto!**

### 3️⃣ Expor o Servidor com ngrok (Terminal 2)

Abra um **novo terminal** e execute:

```bash
ngrok http 3001
```

Você verá algo como:
```
Forwarding  https://abc123-def456.ngrok-free.app -> http://localhost:3001
```

**Copie a URL HTTPS** (ex: `https://abc123-def456.ngrok-free.app`)

**⚠️ IMPORTANTE**: Deixe este terminal aberto também!

### 4️⃣ Configurar o n8n

No seu fluxo do n8n:

1. **Webhook de Saída**: Configure para enviar para:
   ```
   https://SUA-URL-NGROK.webhook/result
   ```
   Exemplo: `https://abc123-def456.ngrok-free.app/webhook/result`

2. **Formato dos dados** que o n8n deve enviar:
   ```json
   {
     "session_id": "mesmo-id-recebido-no-webhook-de-entrada",
     "status": "completed",
     "html_content": "html-em-base64"
   }
   ```

### 5️⃣ Atualizar Variável de Ambiente (Opcional)

Se quiser que o polling funcione também, atualize o `.env`:

```env
VITE_WEBHOOK_SERVER_URL=https://SUA-URL-NGROK
```

Exemplo:
```env
VITE_WEBHOOK_SERVER_URL=https://abc123-def456.ngrok-free.app
```

**Depois disso, reinicie o frontend** (se já estiver rodando).

### 6️⃣ Iniciar o Frontend (Terminal 3)

Abra um **terceiro terminal** e execute:

```bash
npm run dev
```

O site estará disponível em: `http://localhost:8080`

### 7️⃣ Testar o Fluxo

1. ✅ Acesse `http://localhost:8080` no navegador
2. ✅ Faça upload de arquivos PDF
3. ✅ Clique em "Analisar Cotações"
4. ✅ A tela de loading deve aparecer **imediatamente**
5. ✅ Verifique os logs do servidor webhook (Terminal 1) para ver quando o resultado chegar
6. ✅ Quando o n8n enviar o resultado, ele deve aparecer automaticamente no site

## 🔍 Verificando se Está Funcionando

### Logs do Servidor Webhook (Terminal 1)

Quando o n8n enviar o resultado, você verá:
```
📥 Recebendo resultado do n8n...
Session ID: abc-123-def
✅ Resultado salvo para session_id: abc-123-def
```

### Logs do Frontend (Terminal 3)

No console do navegador (F12), você verá:
```
>>> ENVIANDO PARA N8N (WEBHOOK DE ENTRADA) <<<
Session ID: abc-123-def
```

### Testar o Webhook Manualmente (Opcional)

Você pode testar se o servidor está recebendo dados corretamente:

```bash
curl -X POST http://localhost:3001/webhook/result \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "status": "completed",
    "html_content": "PGh0bWw+SGVsbG8gV29ybGQ8L2h0bWw+"
  }'
```

Depois verifique:
```bash
curl http://localhost:3001/api/analysis/test-123
```

## ⚠️ Problemas Comuns

### O n8n não consegue acessar o webhook

- ✅ Verifique se o ngrok está rodando
- ✅ Verifique se a URL no n8n está correta (deve ser HTTPS)
- ✅ Verifique os logs do ngrok para ver se há requisições chegando

### CORS errors

- ✅ O servidor já está configurado com CORS. Se ainda tiver problemas, verifique os headers no n8n.

### O resultado não aparece

- ✅ Verifique os logs do servidor webhook para ver se o resultado chegou
- ✅ Verifique o console do navegador (F12) para ver se há erros
- ✅ Verifique se o `session_id` está sendo preservado no fluxo do n8n

### ngrok pede autenticação

Na versão gratuita do ngrok, você pode precisar criar uma conta. É gratuito e rápido:
1. Acesse https://dashboard.ngrok.com/signup
2. Copie seu authtoken
3. Execute: `ngrok config add-authtoken SEU-TOKEN`

## 🎯 Resumo dos Terminais

Você precisa de **3 terminais abertos**:

1. **Terminal 1**: `npm run dev:server` (servidor webhook)
2. **Terminal 2**: `ngrok http 3001` (expor servidor)
3. **Terminal 3**: `npm run dev` (frontend)

## 🚀 Próximos Passos

Depois de testar localmente, para produção você pode:
- Fazer deploy do servidor webhook no Railway ou Render
- Fazer deploy do frontend no Vercel
- Configurar as URLs públicas no `.env` e no n8n
