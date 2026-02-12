# ⚡ Deploy Rápido - Passo a Passo

## 🎯 Resumo: 2 Deploys

1. **Servidor Webhook** → Railway (5 min)
2. **Frontend** → Vercel (3 min)
3. **Configurar n8n** (2 min)

**Total: ~10 minutos**

---

## 📦 1. Servidor Webhook no Railway

### Passo 1: Criar Projeto
1. Acesse: https://railway.app
2. Login com GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecione seu repositório

### Passo 2: Configurar
1. Railway detecta automaticamente
2. **IMPORTANTE**: Clique em "Settings"
3. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
4. Salve

### Passo 3: Obter URL
1. Após deploy, vá em "Settings" → "Networking"
2. Clique em "Generate Domain"
3. **COPIE A URL** (ex: `https://seu-projeto.up.railway.app`)
4. ✅ **ANOTE ESTA URL!**

---

## 🌐 2. Frontend no Vercel

### Passo 1: Criar Projeto
1. Acesse: https://vercel.com
2. Login com GitHub
3. "Add New" → "Project"
4. Importe seu repositório

### Passo 2: Configurar Variáveis
1. Antes de fazer deploy, vá em "Environment Variables"
2. Adicione:

```
VITE_N8N_WEBHOOK_INPUT_URL=https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
VITE_WEBHOOK_SERVER_URL=https://SUA-URL-RAILWAY
```

**Substitua `SUA-URL-RAILWAY` pela URL que você copiou do Railway!**

### Passo 3: Deploy
1. Clique em "Deploy"
2. Aguarde ~2 minutos
3. ✅ **COPIE A URL DO VERCEL**

---

## ⚙️ 3. Configurar n8n

### No webhook de saída do n8n:

1. Abra seu fluxo no n8n
2. Vá no último nó (webhook de saída)
3. Configure a URL:
   ```
   https://SUA-URL-RAILWAY/webhook/result
   ```
4. Salve o fluxo

---

## ✅ Testar

1. Acesse a URL do Vercel
2. Faça upload de PDFs
3. Clique em "Analisar"
4. Loading deve aparecer imediatamente
5. Quando n8n processar, resultado aparece automaticamente

---

## 🐛 Se Der Erro

### Railway não inicia
- ✅ Verifique se `Root Directory` = `server`
- ✅ Verifique se `Start Command` = `npm start`
- ✅ Veja os logs no Railway

### Vercel não faz build
- ✅ Verifique se variáveis de ambiente estão corretas
- ✅ Veja os logs de build no Vercel

### Webhook não funciona
- ✅ Verifique se URL do Railway está correta no n8n
- ✅ Verifique logs do Railway
- ✅ Verifique se variáveis no Vercel estão corretas

---

## 📞 Precisa de Ajuda?

Se der erro, me envie:
1. Screenshot do erro
2. Logs do Railway (se erro no servidor)
3. Logs do Vercel (se erro no frontend)
4. URL do projeto

Vou ajudar a corrigir! 🚀
