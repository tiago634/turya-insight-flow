# Configuração dos Webhooks do n8n

Este documento explica como configurar os webhooks do n8n para integrar com o sistema de análise de cotações.

## Fluxo de Dados

1. **Webhook de Entrada**: O site envia os documentos PDF diretamente para o n8n
2. **Processamento**: O n8n processa os documentos (pode levar alguns minutos)
3. **Webhook de Saída**: O n8n envia o resultado de volta para o servidor webhook local
4. **Polling**: O frontend verifica periodicamente se o resultado está pronto

## Arquitetura

```
[Frontend] 
  ↓ (envia documentos)
[Webhook de Entrada n8n]
  ↓ (processa)
[Webhook de Saída n8n]
  ↓ (envia resultado)
[Servidor Webhook Local (porta 3001)]
  ↑ (polling)
[Frontend]
```

## 1. Webhook de Entrada (n8n recebe documentos)

### Configuração no n8n

1. Crie um nó **Webhook** no início do seu fluxo
2. Configure o método como **POST**
3. Configure o caminho do webhook (ex: `/webhook/deo-analise` ou `/webhook-test/deo-analise`)
4. Salve a URL completa do webhook

### Dados Recebidos

O webhook receberá um `FormData` com os seguintes campos:

- `session_id`: UUID único da sessão (obrigatório)
- `arquivo_0`, `arquivo_1`, ...: Arquivos PDF enviados
- `quantidade_arquivos`: Número total de arquivos
- `timestamp`: Data/hora do envio (ISO 8601)
- `webhook_output_url`: URL do servidor webhook onde o n8n deve enviar o resultado

### Exemplo de URL do Webhook de Entrada

```
https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
```

### Configuração no Código

Atualize a variável de ambiente no arquivo `.env`:

```env
VITE_N8N_WEBHOOK_INPUT_URL=https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
```

## 2. Webhook de Saída (n8n envia resultado)

### Opção A: Respond to Webhook (Resposta Síncrona)

Se você usar o nó **"Respond to Webhook"** no final do fluxo:
- O n8n responderá diretamente à requisição HTTP original
- Configure os headers no nó "Respond to Webhook":
  - `Content-Disposition: attachment; filename="Analise_DO.html"`
  - `Access-Control-Allow-Origin: *` (ou seu domínio específico)
- O frontend aguardará a resposta diretamente (timeout de 10 minutos)
- **Vantagem**: Mais simples, não precisa de servidor webhook separado
- **Desvantagem**: O usuário precisa manter a conexão aberta durante o processamento

### Opção B: Webhook de Saída Separado (Resposta Assíncrona)

Se você quiser usar um webhook de saída separado:

No final do seu fluxo, adicione um nó **HTTP Request** para enviar o resultado:

1. **Método**: POST
2. **URL**: Use a variável `webhook_output_url` recebida no webhook de entrada
   - Em desenvolvimento: `http://localhost:3001/webhook/result`
   - Em produção: Configure com a URL pública do seu servidor (ex: `https://seu-dominio.com/webhook/result`)
3. **Headers**: 
   - `Content-Type: application/json` (se enviando JSON)
   - ou `Content-Type: multipart/form-data` (se enviando FormData)

### Formato dos Dados a Enviar

Você pode enviar em dois formatos:

#### Opção 1: JSON (Recomendado)

```json
{
  "session_id": "uuid-da-sessao-recebido-no-webhook-de-entrada",
  "status": "completed",
  "html_content": "base64-encoded-html-content"
}
```

#### Opção 2: FormData

```
session_id: uuid-da-sessao
status: completed
html_content: base64-encoded-html-content
```

#### Em caso de erro:

```json
{
  "session_id": "uuid-da-sessao",
  "status": "error",
  "error": "Mensagem de erro descritiva"
}
```

### Exemplo de Configuração no n8n

No último nó do seu fluxo (após processar os documentos):

1. Use um nó **Set** ou **Code** para preparar os dados:
   ```javascript
   // No nó Code do n8n
   const sessionId = $input.item.json.session_id; // Preservar do webhook de entrada
   const htmlContent = $input.item.json.html_result; // seu HTML gerado
   const webhookOutputUrl = $input.item.json.webhook_output_url; // URL recebida
   
   // Converter HTML para base64
   const htmlBase64 = Buffer.from(htmlContent).toString('base64');
   
   return {
     json: {
       session_id: sessionId,
       status: "completed",
       html_content: htmlBase64,
       webhook_output_url: webhookOutputUrl
     }
   };
   ```

2. Use um nó **HTTP Request**:
   - **Method**: POST
   - **URL**: `{{ $json.webhook_output_url }}` (ou use a variável diretamente)
   - **Authentication**: None
   - **Body**: Use o JSON preparado acima

## 3. Servidor Webhook Local

### Iniciar o Servidor

O servidor webhook está localizado em `server/webhook-server.js`.

Para iniciar:

```bash
npm install
npm run dev:server
```

Ou para rodar frontend e servidor juntos:

```bash
npm run dev:all
```

### Endpoints Disponíveis

- **POST** `/webhook/result` - Recebe resultado do n8n
- **GET** `/api/analysis/:sessionId` - Verifica status da análise (polling)
- **DELETE** `/api/analysis/:sessionId` - Remove resultado (opcional)
- **GET** `/health` - Health check

### Porta

O servidor roda na porta **3001** por padrão. Você pode alterar usando a variável de ambiente `PORT`:

```bash
PORT=3002 npm run dev:server
```

## 4. Variáveis de Ambiente

Configure no arquivo `.env`:

```env
# URL do webhook de entrada do n8n
VITE_N8N_WEBHOOK_INPUT_URL=https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13

# URL do servidor webhook local
VITE_WEBHOOK_SERVER_URL=http://localhost:3001
```

**Para produção**, atualize `VITE_WEBHOOK_SERVER_URL` com a URL pública do seu servidor:

```env
VITE_WEBHOOK_SERVER_URL=https://seu-dominio.com
```

## 5. Testando a Integração

### 1. Iniciar o Servidor Webhook

```bash
npm run dev:server
```

Você deve ver:
```
🚀 Servidor webhook rodando na porta 3001
📡 Webhook de saída: http://localhost:3001/webhook/result
🔍 Status check: http://localhost:3001/api/analysis/:sessionId
```

### 2. Iniciar o Frontend

```bash
npm run dev
```

### 3. Testar o Fluxo

1. **Enviar documentos**: Use o formulário no site
2. **Verificar logs do n8n**: Confirme que os dados foram recebidos
3. **Verificar logs do servidor**: Veja se o resultado foi recebido
4. **Verificar no frontend**: O resultado deve aparecer automaticamente

## 6. Estrutura Esperada do Fluxo n8n

```
[Webhook de Entrada] 
  ↓ Recebe: session_id, arquivos, webhook_output_url
[Processar Documentos]
  ↓
[Gerar HTML da Análise]
  ↓
[HTTP Request → webhook_output_url/webhook/result]
  ↓ Envia: session_id, status, html_content
[Servidor Webhook Local]
  ↓ Armazena em memória
[Frontend faz polling]
  ↓ GET /api/analysis/:sessionId
[Resultado exibido]
```

## 7. Importante: Preservar session_id

⚠️ **CRÍTICO**: O `session_id` recebido no webhook de entrada **DEVE** ser preservado durante todo o fluxo do n8n e enviado de volta no webhook de saída. Sem isso, o frontend não conseguirá associar o resultado à sessão correta.

## 8. Troubleshooting

### O site não recebe o resultado

1. ✅ Verifique se o servidor webhook está rodando (`npm run dev:server`)
2. ✅ Verifique se o `session_id` está sendo preservado no fluxo do n8n
3. ✅ Verifique se o webhook de saída está sendo chamado (logs do n8n)
4. ✅ Verifique os logs do servidor webhook (`server/webhook-server.js`)
5. ✅ Verifique se a URL do webhook de saída está correta no n8n

### Erro 400 no webhook de saída

- Certifique-se de que `session_id` está sendo enviado
- Verifique o formato dos dados (JSON ou FormData)
- Verifique os logs do servidor para mais detalhes

### Polling não encontra resultado

- Verifique se o `session_id` usado no polling é o mesmo enviado pelo n8n
- Verifique se o servidor webhook recebeu os dados (logs)
- Verifique se a URL `VITE_WEBHOOK_SERVER_URL` está correta no `.env`

### Servidor não inicia

- Certifique-se de que as dependências estão instaladas: `npm install`
- Verifique se a porta 3001 está disponível
- Verifique os logs de erro no console

## 9. Notas Importantes

- ⚠️ O servidor webhook armazena resultados **em memória**. Se o servidor reiniciar, os resultados serão perdidos.
- ⚠️ Para produção, considere usar Redis ou um banco de dados para persistência.
- ⚠️ O timeout máximo de polling no frontend é de 10 minutos.
- ⚠️ O HTML deve ser enviado como string base64.
- ⚠️ O webhook de saída deve ser chamado mesmo em caso de erro (com `status: "error"`).

## 10. Deploy em Produção

Para produção, você precisará:

1. **Deploy do servidor webhook**: Hospede o servidor em um serviço como:
   - Railway
   - Render
   - Heroku
   - Vercel (usando serverless functions)
   - Sua própria infraestrutura

2. **Configurar URL pública**: Atualize `VITE_WEBHOOK_SERVER_URL` no `.env` com a URL pública

3. **Configurar n8n**: Use a URL pública no webhook de saída

4. **Considerar persistência**: Para produção, considere usar Redis ou banco de dados ao invés de memória
