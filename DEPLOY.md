# 🚀 Guia de Deploy

## Estrutura

- **Frontend**: Vercel (gratuito, fácil)
- **Servidor Webhook**: Railway (gratuito, simples)

---

## 📦 Parte 1: Deploy do Servidor Webhook (Railway)

### Passo 1: Criar conta no Railway

1. Acesse: https://railway.app
2. Faça login com GitHub

### Passo 2: Criar Novo Projeto

1. Clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Conecte seu repositório
4. Selecione o repositório do projeto

### Passo 3: Configurar o Serviço

1. Railway vai detectar automaticamente
2. **IMPORTANTE**: Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
   - **Port**: Railway define automaticamente (use `PORT` env var)

### Passo 4: Configurar Variáveis de Ambiente

No Railway, vá em "Variables" e adicione:
```
PORT=3001
```

### Passo 5: Obter URL Pública

1. Após o deploy, Railway fornece uma URL pública
2. Exemplo: `https://seu-projeto.up.railway.app`
3. **COPIE ESTA URL** - você vai precisar!

### Passo 6: Configurar Domínio Customizado (Opcional)

Railway permite domínio customizado gratuito. Configure se quiser.

---

## 🌐 Parte 2: Deploy do Frontend (Vercel)

### Passo 1: Criar conta no Vercel

1. Acesse: https://vercel.com
2. Faça login com GitHub

### Passo 2: Importar Projeto

1. Clique em "Add New" → "Project"
2. Importe seu repositório GitHub
3. Vercel detecta automaticamente que é um projeto Vite

### Passo 3: Configurar Build Settings

Vercel detecta automaticamente, mas verifique:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Passo 4: Configurar Variáveis de Ambiente

No Vercel, vá em "Settings" → "Environment Variables" e adicione:

```
VITE_N8N_WEBHOOK_INPUT_URL=https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13
VITE_WEBHOOK_SERVER_URL=https://SUA-URL-RAILWAY
```

**Substitua `SUA-URL-RAILWAY` pela URL que você copiou do Railway!**

Exemplo:
```
VITE_WEBHOOK_SERVER_URL=https://seu-projeto.up.railway.app
```

### Passo 5: Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Vercel fornece uma URL: `https://seu-projeto.vercel.app`

---

## ⚙️ Parte 3: Configurar n8n

### Webhook de Saída

No seu fluxo do n8n, configure o webhook de saída para:

```
https://SUA-URL-RAILWAY/webhook/result
```

Exemplo:
```
https://seu-projeto.up.railway.app/webhook/result
```

### Formato dos Dados

O n8n deve enviar:
```json
{
  "session_id": "mesmo-id-recebido-no-webhook-de-entrada",
  "status": "completed",
  "html_content": "html-em-base64"
}
```

---

## ✅ Verificar se Está Funcionando

1. ✅ Acesse a URL do Vercel
2. ✅ Faça upload de documentos
3. ✅ Verifique os logs do Railway para ver se o webhook está recebendo
4. ✅ Verifique os logs do Vercel para ver se há erros

---

## 🔧 Troubleshooting

### Railway não inicia

- Verifique se o `Root Directory` está como `server`
- Verifique se o `Start Command` está como `npm start`
- Verifique os logs do Railway

### Vercel não faz build

- Verifique se todas as dependências estão no `package.json`
- Verifique os logs de build no Vercel

### Webhook não recebe dados

- Verifique se a URL do Railway está correta no n8n
- Verifique os logs do Railway
- Verifique se o CORS está configurado (já está no código)

### Variáveis de ambiente não funcionam

- No Vercel, variáveis devem começar com `VITE_`
- Reinicie o deploy após adicionar variáveis
- Verifique se não há espaços extras nas variáveis

---

## 📝 Resumo das URLs

Após o deploy, você terá:

1. **Frontend**: `https://seu-projeto.vercel.app`
2. **Servidor Webhook**: `https://seu-projeto.up.railway.app`
3. **Webhook de Entrada n8n**: `https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13`

---

## 🎯 Próximos Passos

1. ✅ Deploy do servidor no Railway
2. ✅ Copiar URL do Railway
3. ✅ Deploy do frontend no Vercel
4. ✅ Configurar variáveis de ambiente no Vercel
5. ✅ Configurar webhook de saída no n8n
6. ✅ Testar!
