# 🚀 Deploy Sem GitHub - Upload Direto

## Opção 1: Vercel CLI (Mais Fácil) ⭐

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Fazer Login

```bash
vercel login
```

Isso abrirá o navegador para você fazer login.

### Passo 3: Deploy do Frontend

Na pasta raiz do projeto:

```bash
vercel
```

O Vercel vai fazer perguntas:
- **Set up and deploy?** → `Y`
- **Which scope?** → Selecione sua conta
- **Link to existing project?** → `N` (primeira vez)
- **Project name?** → Digite um nome (ex: `turya-insight-flow`)
- **Directory?** → `.` (ponto, pasta atual)
- **Override settings?** → `N`

### Passo 4: Configurar Variáveis de Ambiente

Durante o deploy, o Vercel pergunta sobre variáveis. Configure:

```bash
vercel env add VITE_N8N_WEBHOOK_INPUT_URL
# Cole: https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13

vercel env add VITE_WEBHOOK_SERVER_URL
# Cole: https://SUA-URL-RAILWAY (depois de fazer deploy do servidor)
```

Ou configure depois no dashboard do Vercel:
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Settings → Environment Variables
4. Adicione as variáveis

### Passo 5: Deploy de Produção

```bash
vercel --prod
```

✅ Pronto! Você terá uma URL tipo: `https://seu-projeto.vercel.app`

---

## Opção 2: Railway CLI (Para o Servidor)

### Passo 1: Instalar Railway CLI

```bash
npm install -g @railway/cli
```

### Passo 2: Fazer Login

```bash
railway login
```

### Passo 3: Criar Projeto

```bash
railway init
```

### Passo 4: Configurar Servidor

```bash
cd server
railway link
railway up
```

### Passo 5: Obter URL

```bash
railway domain
```

Ou acesse: https://railway.app/dashboard

---

## Opção 3: Deploy Manual no Vercel (Via Dashboard)

### Passo 1: Preparar Arquivo ZIP

1. Na pasta raiz do projeto, exclua:
   - `node_modules/`
   - `.env` (se tiver dados sensíveis)
   - `dist/` (se existir)

2. Crie um ZIP da pasta (sem node_modules)

### Passo 2: Upload no Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique em "Add New" → "Project"
3. Clique em "Browse" ou arraste o ZIP
4. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Passo 3: Configurar Variáveis

1. No projeto, vá em "Settings" → "Environment Variables"
2. Adicione:
   ```
   VITE_N8N_WEBHOOK_INPUT_URL=https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
   VITE_WEBHOOK_SERVER_URL=https://SUA-URL-RAILWAY
   ```

### Passo 4: Deploy

1. Clique em "Deploy"
2. Aguarde o build

---

## Opção 4: Render (Alternativa Simples)

### Para o Servidor Webhook:

1. Acesse: https://render.com
2. "New +" → "Web Service"
3. "Build and deploy from a Git repository" → **NÃO**, escolha "Public Git repository" ou "Manual"
4. Se escolher Manual:
   - Faça upload do ZIP da pasta `server`
   - Configure:
     - Name: `turya-webhook`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node webhook-server.js`
     - Port: `3001`

### Para o Frontend:

1. "New +" → "Static Site"
2. Upload do ZIP (sem node_modules)
3. Configure:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

---

## 🎯 Recomendação: Vercel CLI

**É a forma mais fácil e rápida:**

```bash
# 1. Instalar
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

**Pronto!** Em 2 minutos você tem o site no ar.

---

## ⚠️ Importante

### Para o Servidor Webhook:

O Railway e Render precisam de Git ou CLI. Para upload manual completo, considere:

1. **Render** (aceita ZIP manual)
2. **Heroku** (aceita Git ou CLI)
3. **Fly.io** (aceita CLI)

### Alternativa Mais Simples:

Use **ngrok** localmente para testes, e depois faça deploy apenas do frontend no Vercel. O servidor webhook pode ficar rodando localmente com ngrok durante desenvolvimento.

---

## 📝 Checklist Rápido

- [ ] Instalar Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Deploy frontend: `vercel --prod`
- [ ] Configurar variáveis no dashboard do Vercel
- [ ] Deploy servidor (Railway CLI ou Render manual)
- [ ] Configurar n8n com URL do servidor

---

## 🐛 Problemas?

### Vercel CLI não funciona

- Verifique se Node.js está instalado: `node --version`
- Tente: `npm install -g vercel@latest`

### Build falha

- Verifique se todas as dependências estão no `package.json`
- Veja os logs: `vercel logs`

### Variáveis não funcionam

- Reinicie o deploy após adicionar variáveis
- Verifique se começam com `VITE_`
