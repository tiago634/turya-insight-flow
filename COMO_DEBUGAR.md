# Como descobrir por que o frontend fica em "Analisando..." depois que o fluxo rodou

Quando o fluxo do n8n termina com sucesso mas a tela continua em "Analisando suas cotações...", o problema está em algum ponto entre o n8n e o frontend. Siga estes passos **na ordem** para achar onde está falhando.

---

## 1. Pegar o session_id que o frontend está usando

Na tela de "Analisando...", anote o **ID** que aparece (ex.: `bb205995-9c5f-4ad7-9f21-ce3d33ef5f2d`). Você vai usar esse ID nos passos abaixo.

---

## 2. Ver se o backend tem algum resultado guardado

Abra no navegador (ou em outra aba):

```
https://serene-clarity-production.up.railway.app/api/debug
```

- **Se aparecer `stored_results_count: 0` e `session_ids: []`**  
  O backend **nunca recebeu** um POST com resultado do n8n (ou deu erro 400). Vá para o **Passo 4**.

- **Se aparecer `redis_connected: true`**  
  O Redis está em uso. Se aparecer `redis_connected: false`, o servidor está usando memória; com mais de uma instância no Railway o resultado pode estar em outra instância.

- **Se aparecer uma lista em `session_ids`**  
  Confira se o **seu** session_id (o da tela) está nessa lista. Se não estiver, o n8n pode estar enviando outro session_id ou o POST não chegou.

---

## 3. Ver se o backend tem resultado para o seu session_id

Abra no navegador (troque `SEU_SESSION_ID` pelo ID que você anotou no passo 1):

```
https://serene-clarity-production.up.railway.app/api/debug/session/SEU_SESSION_ID
```

Exemplo:

```
https://serene-clarity-production.up.railway.app/api/debug/session/bb205995-9c5f-4ad7-9f21-ce3d33ef5f2d
```

- **`found: false`**  
  O backend **não tem** resultado para esse session_id. Possíveis causas:
  - O n8n não enviou o POST para `/webhook/result` com esse session_id.
  - O n8n enviou mas o servidor respondeu **400** (ex.: "Arquivo HTML não recebido") e não gravou nada.
  - Redis não está conectado e há mais de uma instância; o POST caiu em uma e o GET em outra (volte ao checklist de Redis).

- **`found: true` e `has_html: false`**  
  O backend tem um registro para esse session_id mas **sem HTML**. O n8n está enviando o POST sem o arquivo (campo **data** em Form-Data). Ajuste o nó HTTP Request no n8n: Body = Form-Data, com **session_id** (texto) e **data** (tipo File, Input Data Field Name = `data`).

- **`found: true` e `has_html: true`**  
  O backend tem o resultado e o HTML. O problema está no **frontend** (cache, resposta do GET não usada, etc.). Verifique no DevTools → Network a resposta do GET em `/api/analysis/SEU_SESSION_ID`: deve vir `status: "completed"` e `html_content` com conteúdo. Se vier 304 ou resposta em cache, pode ser cache do navegador (já adicionamos headers anti-cache e `?t=...` no polling).

---

## 4. Ver o que o n8n está enviando (POST /webhook/result)

No n8n, abra a **execução** que já terminou (a que mostra "Success" e ~4 min).

1. Clique no nó **HTTP Request** que envia para o Railway (`/webhook/result`).
2. Veja a aba **OUTPUT**:
   - **Status 200** e no JSON algo como **`html_received_bytes: 12345`**  
     → O Railway recebeu e armazenou. Se o backend ainda não tem esse session_id (passo 3), é provável que Redis não esteja conectado ou que haja mais de uma instância (veja checklist Redis).
   - **Status 400** e mensagem tipo "Arquivo HTML não recebido"  
     → O n8n **não está enviando o arquivo** no body. Use **Form-Data** com dois parâmetros: **session_id** (texto) e **data** (tipo File, Input Data Field Name = `data`). Não use só "n8n Binary File" como body.
   - **Erro de rede / timeout**  
     → O Railway pode estar demorando ou a URL está errada; confira a URL do nó (deve ser `https://serene-clarity-production.up.railway.app/webhook/result`).

---

## 5. Logs do Railway (serviço serene-clarity)

Nos **logs** do serviço no Railway:

- **Na subida do servidor**  
  - Deve aparecer **"Redis conectado"** se você configurou `REDIS_URL` ou `REDIS_PUBLIC_URL`.  
  - Se aparecer **"Armazenamento em memória"**, o Redis não está em uso; com várias instâncias o resultado pode ficar em uma e o polling em outra.

- **Quando o fluxo do n8n termina**  
  - Deve aparecer algo como: **"Resultado salvo para session_id: ..."** e **"Store: Redis (key analysis:...)"**.  
  - Se não aparecer nada, o POST do n8n não chegou ou retornou 400 antes de gravar.

- **Quando o frontend faz polling**  
  - Se aparecer **"Polling: session_id X ainda não recebeu resultado"** e **"Session IDs armazenados: [...]"** com o seu session_id na lista, então **outra instância** tem o resultado (Redis não está conectado ou a variável não está definida).  
  - Se aparecer **"Polling: resultado encontrado para session_id X, hasHtml: true"**, o backend está devolvendo o HTML; o problema é no frontend (resposta em cache ou lógica da página).

---

## Resumo: onde está o problema?

| O que você viu | Onde está o problema | O que fazer |
|----------------|----------------------|-------------|
| `/api/debug` → `stored_results_count: 0` | n8n não está gravando no Railway | Passo 4: conferir nó HTTP Request (Form-Data, campo data, 200 vs 400). |
| `/api/debug/session/ID` → `found: false` mas `/api/debug` tem outros IDs | session_id diferente ou múltiplas instâncias | Conferir no n8n o session_id enviado no POST. Garantir Redis (REDIS_URL ou REDIS_PUBLIC_URL) e redeploy. |
| `/api/debug/session/ID` → `found: true`, `has_html: false` | n8n não envia o arquivo | No n8n: Form-Data com session_id + **data** (File). |
| `/api/debug/session/ID` → `found: true`, `has_html: true` | Backend ok; problema no frontend | Ver resposta do GET /api/analysis/ID no DevTools (conteúdo e se não é 304/cache). |
| Logs: "Armazenamento em memória" | Redis não conectado | Definir REDIS_URL ou REDIS_PUBLIC_URL no Railway e redeploy. |

Depois de fazer as alterações (n8n, Redis ou frontend), rode o fluxo de novo e repita os passos 2 e 3 com o novo session_id.
