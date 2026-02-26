# Servidor Webhook

Servidor Node.js simples para receber resultados do n8n e permitir polling do frontend.

## Instalação

As dependências são instaladas automaticamente quando você roda `npm run dev:server` na raiz do projeto.

Ou manualmente:

```bash
cd server
npm install
```

## Uso

### Desenvolvimento

Na raiz do projeto:

```bash
npm run dev:server
```

Ou diretamente:

```bash
cd server
node webhook-server.js
```

### Produção

```bash
cd server
PORT=3001 node webhook-server.js
```

## Endpoints

- `POST /webhook/result` - Recebe resultado do n8n
- `GET /api/analysis/:sessionId` - Verifica status (polling)
- `DELETE /api/analysis/:sessionId` - Remove resultado
- `GET /health` - Health check

## Redis (Railway com várias instâncias)

Se o Railway rodar **mais de uma instância**, o resultado gravado pelo n8n pode ficar em uma instância e o polling do frontend bater em outra (em memória cada uma tem seu próprio Map). Para compartilhar o estado:

1. No Railway, adicione o plugin **Redis** ao projeto (ou crie um Redis e copie a URL).
2. Defina a variável **`REDIS_URL`** no serviço do servidor (geralmente o Railway já expõe algo como `REDIS_URL` quando o Redis está no mesmo projeto).
3. Faça redeploy. O servidor usará Redis para armazenar resultados; o frontend passará a receber o relatório no polling.

Sem `REDIS_URL`, o servidor usa memória local (ok para uma única instância ou desenvolvimento).

## Porta

Padrão: `3001`

Configure via variável de ambiente:

```bash
PORT=3002 node webhook-server.js
```

## Armazenamento

⚠️ **Importante**: Os resultados são armazenados **em memória**. Se o servidor reiniciar, os dados serão perdidos.

Para produção, considere usar Redis ou um banco de dados.
