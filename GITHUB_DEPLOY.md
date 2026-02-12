# 🚀 Subir Projeto para GitHub e Deploy no Netlify

## Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com
2. Faça login
3. Clique no **"+"** (canto superior direito) → **"New repository"**
4. Configure:
   - **Repository name**: `turya-insight-flow` (ou o nome que preferir)
   - **Description**: (opcional)
   - **Public** ou **Private** (escolha)
   - **NÃO marque** "Initialize with README" (já temos arquivos)
5. Clique em **"Create repository"**

## Passo 2: Inicializar Git no Projeto

Abra o terminal na pasta do projeto e execute:

```bash
cd c:\Users\tiago\Downloads\frontend\turya-insight-flow-main

# Inicializar git
git init

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "Initial commit - Turya Insight Flow"
```

## Passo 3: Conectar ao GitHub

No GitHub, você verá instruções. Execute no terminal:

```bash
# Adicionar remote (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/turya-insight-flow.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

**Se pedir autenticação:**
- Use um **Personal Access Token** (não sua senha)
- Como criar: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- Dê permissão de `repo`

## Passo 4: Deploy no Netlify

### 4.1 Criar Site

1. Acesse: https://app.netlify.com
2. Faça login (pode usar GitHub)
3. Clique em **"Add new site"** → **"Import an existing project"**
4. Clique em **"GitHub"**
5. Autorize o Netlify a acessar seus repositórios
6. Selecione o repositório `turya-insight-flow`

### 4.2 Configurar Build

Configure:
- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 4.3 ⚠️ IMPORTANTE: Variáveis de Ambiente

Antes de fazer deploy, clique em **"Show advanced"** ou depois vá em **"Site settings"** → **"Environment variables"**

Adicione:

```
Key: VITE_N8N_WEBHOOK_INPUT_URL
Value: https://wgatech.app.n8n.cloud/webhook-test/20369a72-f180-421f-8048-9ff66c9deb13

Key: VITE_WEBHOOK_SERVER_URL
Value: https://serene-clarity-production.up.railway.app
```

### 4.4 Fazer Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build (2-5 minutos)
3. ✅ Pronto! Você terá uma URL tipo: `https://seu-projeto.netlify.app`

## Passo 5: Configurar n8n

No webhook de saída do n8n, configure:

```
https://serene-clarity-production.up.railway.app/webhook/result
```

## ✅ Checklist Completo

- [ ] Repositório criado no GitHub
- [ ] Git inicializado no projeto
- [ ] Código commitado
- [ ] Push feito para GitHub
- [ ] Site criado no Netlify
- [ ] Repositório conectado no Netlify
- [ ] Build command configurado: `npm run build`
- [ ] Publish directory configurado: `dist`
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy feito
- [ ] n8n configurado com URL do Railway

## 🔄 Atualizações Futuras

Sempre que você fizer mudanças:

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

O Netlify vai fazer deploy automático! 🎉

## 🐛 Problemas Comuns

### Git não reconhece arquivos

```bash
git add .
git status  # Verifique o que foi adicionado
```

### Push rejeitado

```bash
git pull origin main --rebase
git push -u origin main
```

### Build falha no Netlify

- Verifique os logs de build
- Certifique-se de que `package.json` tem todas as dependências
- Verifique se Node version está correto (18 ou 20)

### Variáveis não funcionam

- Verifique se começam com `VITE_`
- Faça um novo deploy após adicionar variáveis
- Verifique se não há espaços extras
