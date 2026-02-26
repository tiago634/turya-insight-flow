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
3. Verifique se já existe **`REDIS_URL`** (às vezes o Railway adiciona ao vincular o Redis ao serviço).
4. **Se não existir:** clique em **"New Variable"** ou **"+ Add Variable"**:
   - **Nome:** `REDIS_URL`
   - **Valor:** copie a URL do Redis. Para obter:
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
