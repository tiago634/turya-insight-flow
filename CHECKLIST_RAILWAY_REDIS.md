# Checklist: Redis no Railway (para o relatório chegar no frontend)

Quando o Railway roda **mais de uma instância**, o resultado que o n8n envia fica na memória de uma instância e o polling do frontend pode bater em outra. Por isso o frontend fica em "Analisando..." mesmo com o fluxo terminado.

**Solução:** usar Redis para armazenar os resultados. Todas as instâncias leem e escrevem no mesmo Redis.

---

## O que fazer no Railway (na ordem)

### 1. Adicionar Redis ao projeto

1. Acesse [railway.app](https://railway.app) e abra o **projeto** onde está o serviço do servidor (ex.: serene-clarity).
2. No projeto, clique em **"+ New"** (ou **"Add Service"** / **"New"**).
3. Escolha **"Database"** e depois **"Add Redis"** (ou **"Redis"**).
4. O Railway cria o Redis e geralmente já expõe a variável **`REDIS_URL`** para outros serviços do mesmo projeto.

### 2. Conectar o serviço do servidor ao Redis

1. Clique no **serviço do seu servidor** (o que roda o `webhook-server.js`), não no Redis.
2. Vá na aba **"Variables"** (ou **"Settings"** → Variables).
3. Verifique se já existe **`REDIS_URL`** ou **`REDIS_PUBLIC_URL`** (às vezes o Railway adiciona ao vincular o Redis ao serviço). O servidor aceita qualquer um dos dois nomes.
4. **Se não existir:** clique em **"New Variable"** ou **"+ Add Variable"**:
   - **Nome:** `REDIS_URL` (ou `REDIS_PUBLIC_URL` se preferir; o código aceita os dois).
   - **Valor:** referência ao Redis. Ex.: `${{Redis.REDIS_PUBLIC_URL}}` (troque `Redis` pelo nome do seu serviço Redis se for diferente). Ou copie a URL direta. Para obter:
     - Clique no serviço **Redis** que você criou.
     - Na aba **"Connect"** ou **"Variables"** do Redis, copie a **Connection URL** ou o valor que aparece como `REDIS_URL` (ex.: `redis://default:xxxxx@host:port`).
     - Cole esse valor na variável `REDIS_URL` do **serviço do servidor**.

### 3. Redeploy do servidor

1. Ainda no serviço do **servidor** (não no Redis).
2. Vá na aba **"Deployments"** (ou **"Deploy"**).
3. Clique em **"Redeploy"** na última implantação **ou** faça um novo deploy a partir do repositório (se o Railway estiver conectado ao GitHub, o push que você deu já pode ter disparado um deploy; confira se o deploy mais recente está com sucesso).

### 4. Conferir nos logs

1. Abra os **logs** do serviço do servidor no Railway.
2. Após subir, deve aparecer algo como: **"Redis conectado (resultados compartilhados entre instâncias)"**.
3. Se aparecer **"Armazenamento em memória (defina REDIS_URL...)"**, a variável `REDIS_URL` não está definida ou o servidor não conseguiu conectar; revise o passo 2.

---

## Se o Redis continuar vazio e o frontend em "Analisando..."

1. **Logs do serviço serene-clarity no Railway**  
   - Ao subir, deve aparecer **"Redis conectado"**. Se aparecer **"Armazenamento em memória"**, a variável de Redis não está definida ou não está sendo lida: use **`REDIS_URL`** ou **`REDIS_PUBLIC_URL`** com valor `${{Redis.REDIS_PUBLIC_URL}}` (ajuste o nome do serviço Redis se for outro).

2. **n8n: resposta do nó HTTP Request**  
   - Se o n8n devolver **400** ("Arquivo HTML não recebido"), nada é gravado no Redis. Nesse caso, no nó HTTP Request use **Body Content Type = Form-Data** com **dois** parâmetros: **session_id** (texto) e **data** (tipo File, Input Data Field Name = `data`). Não use "n8n Binary File" sozinho.
   - Quando der certo, a resposta do HTTP Request virá com **200** e algo como **`html_received_bytes: 12345`**. Aí o resultado será gravado no Redis e o frontend receberá no polling.

3. **Após um fluxo com sucesso (200 no HTTP Request)**  
   - No Redis, na aba Data, deve aparecer uma chave do tipo **`analysis:bb205995-...`** (o UUID do session_id). Se não aparecer, o servidor não está usando Redis (confira o item 1).

## Depois disso

Rode o fluxo de novo (envie pelo frontend, espere o n8n terminar). O resultado será gravado no Redis e qualquer instância que atender o polling vai devolver o relatório; o frontend deve sair de "Analisando..." e exibir o relatório.

---

## Resumo rápido

| Onde | Ação |
|------|------|
| Railway → Projeto | + New → Database → Add Redis |
| Serviço do servidor → Variables | Garantir que existe `REDIS_URL` (copiar do Redis se precisar) |
| Serviço do servidor → Deployments | Redeploy |
| Logs do servidor | Ver "Redis conectado" |
