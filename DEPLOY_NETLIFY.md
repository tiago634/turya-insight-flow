# 🚀 Deploy no Netlify - Guia Rápido

## Passo a Passo

### 1️⃣ Acessar Netlify

1. Acesse: https://app.netlify.com
2. Faça login (pode usar GitHub, GitLab, ou email)

### 2️⃣ Criar Novo Site

1. Clique em **"Add new site"** → **"Import an existing project"**
2. Escolha uma das opções:
   - **Deploy manually** (se quiser fazer upload direto)
   - **GitHub** (se tiver repositório no GitHub)

### 3️⃣ Se escolher "Deploy manually"

1. Arraste a pasta do projeto (ou faça ZIP sem `node_modules`)
2. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` ou `20` (se pedir)

### 4️⃣ Se escolher GitHub

1. Autorize o Netlify a acessar seu repositório
2. Selecione o repositório
3. Configure:
   - **Branch to deploy**: `main` ou `master`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 5️⃣ ⚠️ IMPORTANTE: Configurar Variáveis de Ambiente

Antes de fazer deploy, configure as variáveis:

1. Clique em **"Site settings"** → **"Environment variables"**
2. Adicione estas variáveis:

```
VITE_N8N_WEBHOOK_INPUT_URL = https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
VITE_WEBHOOK_SERVER_URL = https://serene-clarity-production.up.railway.app
```

**⚠️ IMPORTANTE**: 
- As variáveis devem começar com `VITE_` para funcionar no frontend
- Após adicionar, você precisa fazer um novo deploy

### 6️⃣ Fazer Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build completar (pode levar 2-5 minutos)
3. Você receberá uma URL tipo: `https://seu-projeto.netlify.app`

### 7️⃣ Configurar Domínio Customizado (Opcional)

1. Vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Siga as instruções

---

## ✅ Checklist

- [ ] Site criado no Netlify
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Variável `VITE_N8N_WEBHOOK_INPUT_URL` configurada
- [ ] Variável `VITE_WEBHOOK_SERVER_URL` configurada
- [ ] Deploy concluído
- [ ] Site funcionando

---

## 🔧 Configurações Importantes

### Build Settings

```
Build command: npm run build
Publish directory: dist
Node version: 18 (ou 20)
```

### Variáveis de Ambiente

```
VITE_N8N_WEBHOOK_INPUT_URL=https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
VITE_WEBHOOK_SERVER_URL=https://serene-clarity-production.up.railway.app
```

---

## 🐛 Problemas Comuns

### Build falha

- Verifique se todas as dependências estão no `package.json`
- Verifique os logs de build no Netlify
- Certifique-se de que o Node version está correto

### Variáveis não funcionam

- Verifique se começam com `VITE_`
- Faça um novo deploy após adicionar variáveis
- Verifique se não há espaços extras

### Site não carrega

- Verifique se o "Publish directory" está como `dist`
- Verifique os logs de deploy
- Certifique-se de que o build foi bem-sucedido

---

## 📝 Depois do Deploy

1. ✅ Teste o site
2. ✅ Configure o n8n com: `https://serene-clarity-production.up.railway.app/webhook/result`
3. ✅ Teste o fluxo completo

---

## 🎯 URLs Finais

- **Frontend**: `https://seu-projeto.netlify.app` (sua URL do Netlify)
- **Servidor Webhook**: `https://serene-clarity-production.up.railway.app`
- **Webhook de saída (n8n)**: `https://serene-clarity-production.up.railway.app/webhook/result`
