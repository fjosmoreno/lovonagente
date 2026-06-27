# Lovon Agente — Deploy no CPanel

Pacote do site **Lovon Agente** (Next.js 16 + Prisma + SQLite + NextAuth) pronto para subir no seu servidor.

> **Credenciais demo já populadas:**
> - Login: `demo@lovon.com` / Senha: `demo123`
> - Handle: `demo` — chat em `/?chat=demo`, loja em `/?shop=demo`

---

## 🎯 O que veio errado no primeiro pacote (e foi corrigido)

| Problema | Causa | Solução neste pacote |
|---|---|---|
| 404 Not Found no site | Startup file era `start.sh` (script bash), CPanel Node Selector espera `.js` | Agora é `app.js` |
| "package.json não encontrado" | Zip descompactou como `lovon-deploy/` dentro de `public_html/` | Documentado: extrair tudo **dentro** de `public_html/` |
| App quebraria silenciosamente | Binários nativos (Prisma engine, sharp) compilados para **macOS** (meu ambiente de build), servidor é **Linux** | Rebuild feito com `--os=linux --cpu=x64`. Engines Prisma: glibc + musl |
| Modo Development | Deveria ser Production pra deploy | Documentado para setar Production |

---

## 📋 Como subir no CPanel (Setup Node.js App) — método recomendado

A tela que você me mandou é o **"Setup Node.js App"** (também chamado de "Application Manager" no menu). É o caminho certo. Siga EXATAMENTE estes passos:

### Passo 1 — Limpar o que tem

1. No CPanel, volte em "Setup Node.js App"
2. Clique no botão vermelho **"DESTROY"** da app existente (PAUTAVERTICAL.COM.BR/) para remover a app quebrada

### Passo 2 — Upload dos arquivos

Faça upload do **conteúdo** do zip (não a pasta `lovon-deploy`!) para `public_html/`.

Opção A — Via Gerenciador de Arquivos do CPanel:
1. Abra File Manager → navegue até `public_html/`
2. Faça upload do `lovon-deploy.zip`
3. Clique com botão direito no zip → **Extract**
4. Quando ele perguntar o caminho, digite `/home/pautave1/public_html/` (ou deixe o padrão)
5. **DEPOIS** de extrair: entre na pasta `lovon-deploy/` que foi criada e mova **todo o conteúdo** (app.js, .env, server.js, .next, public, node_modules, db, package.json, .htaccess) um nível acima, para `public_html/` direto
6. Apague a pasta `lovon-deploy/` vazia e o zip

Opção B — Mais simples, por SSH (se você tem):
```bash
cd ~/public_html
wget https://...  # ou scp do seu Mac
unzip lovon-deploy.zip
mv lovon-deploy/* .
mv lovon-deploy/.* . 2>/dev/null
rmdir lovon-deploy
rm lovon-deploy.zip
```

Depois de extrair, em `public_html/` você deve ter estes itens:
```
app.js          ← este é o startup file
server.js
.env
.env.example (se houver)
.htaccess
package.json
.next/
public/
node_modules/
db/
start-bg.sh     (opcional, só VPS)
stop.sh         (opcional, só VPS)
```

### Passo 3 — Criar/Editar a app Node no CPanel

No **Setup Node.js App**, clique em **"CREATE APPLICATION"** (ou edite a existente) e preencha EXATAMENTE assim:

| Campo | Valor |
|---|---|
| Node.js version | **22.22.3** (ou a mais recente disponível) |
| Application mode | **Production** ← IMPORTANTE! |
| Application root | `/home/pautave1/public_html` |
| Application URL | `pautavertical.com.br` |
| Application startup file | **`app.js`** ← não `start.sh`, não `server.js` |

**NÃO clique em "Run NPM Install"** — o `node_modules` já veio no zip com os binários Linux corretos. Rodar `npm install` de novo pode sobrescrever com versões erradas.

### Passo 4 — Variáveis de ambiente (opcional)

Como o `.env` já tem o `DATABASE_URL` configurado, não precisa adicionar nada. Mas se quiser ver/editar:
- Seção "Environment variables" → "ADD VARIABLE" → key `DATABASE_URL`, value `file:/home/pautave1/public_html/db/custom.db`

### Passo 5 — Iniciar

1. Clique em **"SALVAR"** (canto superior direito)
2. Depois clique no botão **"INICIAR APLICATIVO"** (azul)
3. Espere 5-15 segundos
4. Acesse `https://pautavertical.com.br/` ← deve aparecer a tela de login do Lovon

### Passo 6 — Se der erro

Abra o **error log do Passenger**:
- CPanel → "Errors" no menu lateral (ícone de exclamação)
- Ou via SSH: `tail -f ~/logs/pautavertical.com.br.error.log`

Erros comuns e soluções:
- **"Cannot find module '@prisma/client'"** → os binários não foram extraídos. Verifique se `node_modules/.prisma/client/` tem arquivos `.so.node`
- **"Unable to open the database file"** → o `app.js` resolve o path automaticamente, mas confira se `/home/pautave1/public_html/db/custom.db` existe e tem permissão de leitura
- **"EACCES permission denied"** → `chmod -R 755 ~/public_html/db` no SSH, e garanta que o owner é o usuário do CPanel

---

## 🔧 Como funciona o `app.js`

Diferente do `start.sh` (script bash que o Node Selector não aceita), o `app.js` é um arquivo JavaScript que o CPanel executa diretamente com `node`. Ele faz 4 coisas que o `start.sh` fazia:
1. Carrega o `.env` (parse manual, sem dependência de dotenv)
2. Resolve `DATABASE_URL` para caminho **absoluto** (o Prisma tem um bug onde resolve relativo ao `schema.prisma` gerado, não ao cwd — então `./db/custom.db` quebra em alguns ambientes)
3. Garante `NODE_ENV=production`
4. Carrega o `server.js` do Next.js standalone

Você pode customizar o `app.js` à vontade — é seu agora.

---

## 🧪 Testar localmente (no seu Mac) antes de subir

```bash
unzip lovon-deploy.zip -d test-deploy
cd test-deploy
node app.js
# Abre http://localhost:3000
```

Login: `demo@lovon.com` / `demo123`

---

## 🔐 Segurança recomendada (depois do primeiro deploy funcional)

1. **Mude a senha do admin demo** — logue em `https://pautavertical.com.br/`, clique no avatar (canto superior direito) → "Alterar senha"
2. **Mova o `db/` para fora de `public_html`** (opcional, mas recomendado):
   ```bash
   mkdir -p ~/lovon-data
   mv ~/public_html/db ~/lovon-data/
   # Edite .env: DATABASE_URL=file:/home/pautave1/lovon-data/custom.db
   # Reinicie a app
   ```
3. **HTTPS** — ative o AutoSSL do CPanel (deveria estar ativo por padrão)
4. **Backups** — o banco é 1 arquivo só:
   ```bash
   cp ~/public_html/db/custom.db ~/backups/custom-$(date +%Y%m%d).db
   ```

---

## 🆘 Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `Cannot find module '../server.js'` | Extraiu errado — tem `public_html/lovon-deploy/app.js` em vez de `public_html/app.js` | Mova o conteúdo um nível acima |
| `EADDRINUSE :::3000` | Outra app Node está usando a porta | Mude a porta no CPanel Application settings |
| `Error: ENOENT: no such file or directory, open '.../db/custom.db'` | Path errado do banco | Confira `.env`. Use caminho absoluto: `file:/home/pautave1/public_html/db/custom.db` |
| `ELIFECYCLE` ou `EACCES` | Permissões erradas | `chmod -R 755 ~/public_html/db` |
| App reinicia o tempo todo | Erro fatal no startup | Veja o error log e me chama com a mensagem |
| Tudo carrega mas login não funciona | Banco vazio | Confira se `db/custom.db` tem ~6.5MB. Se tiver poucos KB, o zip não extraiu direito |

---

## 📂 Estrutura do pacote

```
lovon-deploy/
├── app.js              ← startup file (entry point pro CPanel)
├── server.js           ← Next.js standalone server (chamado por app.js)
├── package.json        ← metadata + deps de produção
├── .env                ← DATABASE_URL=file:./db/custom.db
├── .htaccess           ← config Apache (só se usar Passenger, ignore se for Node Selector)
├── public/             ← assets públicos
├── db/
│   └── custom.db       ← banco SQLite (6.5MB, com dados demo)
├── .next/              ← build do Next.js
├── node_modules/       ← deps de produção com binários Linux x64
├── start-bg.sh         ← (opcional) inicia em background via SSH
├── stop.sh             ← (opcional) para a instância
└── README-DEPLOY.md    ← este arquivo
```

Bons deploys! 🚀
