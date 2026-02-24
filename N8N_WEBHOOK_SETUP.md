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

O webhook recebe **multipart/form-data** (arquivos como binário, sem base64):

- **Campos de texto:** `session_id`, `webhook_output_url`, `timestamp`, `quantidade_arquivos`
- **Arquivos:** `arquivo_0`, `arquivo_1`, ... (binário, mesmo tipo e nome original)

No n8n, se o `body` do output do Webhook vier vazio, confira no nó Webhook se há opção tipo "Body Content Type" / "Form Data" ou "Multipart" e ative. Os arquivos podem estar em **binary** (ex.: `$binary.arquivo_0`). Para os campos, use `{{ $json.body.session_id }}` ou `{{ $json.session_id }}` conforme a estrutura do output.

### Exemplo de URLs do Webhook de Entrada

**⚠️ IMPORTANTE**: Existem dois tipos de URLs:

1. **URL de TESTE** (só funciona quando você clica em "Execute workflow"):
   ```
   https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
   ```
   - Contém `/webhook-test/` no caminho
   - Só funciona uma vez após clicar em "Execute workflow"
   - ❌ NÃO use em produção!

2. **URL de PRODUÇÃO** (funciona sempre quando o workflow está ativado):
   ```
   https://wgatech.app.n8n.cloud/webhook/20369a72-f180-421f-8048-9ff66c9deb13
   ```
   - Contém `/webhook/` (sem `-test`)
   - Funciona continuamente quando o workflow está ativado
   - ✅ Use esta em produção!

### Como Obter a URL de Produção

1. No n8n, abra seu workflow
2. Clique no botão **"Active"** (ou "Ativar") para ativar o workflow
3. Clique no nó Webhook de entrada
4. Copie a URL que aparece (deve ser `/webhook/` e não `/webhook-test/`)

### Configuração no Código

**Para desenvolvimento local** (arquivo `.env`):
```env
VITE_N8N_WEBHOOK_INPUT_URL=https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
```

**Para produção** (Railway - variável `N8N_WEBHOOK_INPUT_URL`):
```env
N8N_WEBHOOK_INPUT_URL=https://wgatech.app.n8n.cloud/webhook/20369a72-f180-421f-8048-9ff66c9deb13
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

### O fluxo só chega no nó Webhook e para

Se o fluxo executa só até o nó **Webhook** e não continua para os próximos nós:

1. **Ver a saída do Webhook**
   - No n8n, após uma execução, clique no nó **Webhook** e abra a saída (Output).
   - Com **multipart/form-data**, os campos costumam vir em **body** (ex.: `body.session_id`, `body.webhook_output_url`).
   - Os arquivos vêm em **binary** (ex.: `data.arquivo_0`).

2. **Ajustar o próximo nó**
   - O nó logo após o Webhook precisa usar os dados da saída do Webhook.
   - Use expressões como:
     - `{{ $json.body.session_id }}` ou `{{ $json.session_id }}`
     - `{{ $json.body.webhook_output_url }}` ou `{{ $json.webhook_output_url }}`
   - Se o próximo nó esperar um único item e o Webhook devolver vários (ou vice-versa), use um nó **Code** ou **Set** para montar um único item com os campos certos.

3. **Não usar “Respond to Webhook” no primeiro nó**
   - Se o nó Webhook de **entrada** estiver com “Respond to Webhook” e for o único a responder, o fluxo pode ser encerrado ali.
   - Para fluxo assíncrono (processar e depois enviar para o Railway), o Webhook de entrada deve **apenas** receber os dados e passar para o próximo nó, **sem** “Respond to Webhook” nesse nó.

4. **Conexão entre nós**
   - Confirme que há uma conexão (seta) do nó **Webhook** para o próximo nó.
   - Confirme que não há filtro/condição que impeça a execução de seguir.

5. **Exemplo de nó Code logo após o Webhook**
   - Para normalizar a saída do Webhook e garantir um item com os campos certos para o resto do fluxo:
   ```javascript
   const body = $input.item.json.body || $input.item.json;
   const sessionId = body.session_id || $input.item.json.session_id;
   const webhookOutputUrl = body.webhook_output_url || $input.item.json.webhook_output_url;
   return {
     json: {
       session_id: sessionId,
       webhook_output_url: webhookOutputUrl,
       timestamp: body.timestamp,
       quantidade_arquivos: body.quantidade_arquivos
     },
     binary: $input.item.binary
   };
   ```
   - Assim, os nós seguintes podem usar `$json.session_id` e `$json.webhook_output_url` sem se preocupar com `body`.

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
