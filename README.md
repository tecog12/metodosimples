# Método Simples — App de finanças pessoais

Aplicativo de desktop (Windows, macOS e Linux) para controle de gastos e
orçamento, feito para os leitores do livro **Método Simples**. Cada leitor
cria sua própria conta e os dados ficam salvos na nuvem (Supabase), então o
mesmo login funciona em qualquer computador.

---

## 1. Como os leitores instalam (usuário final)

1. Acesse a página de **Releases** do repositório no GitHub:
   `https://github.com/tecog12/metodosimples/releases`
2. Baixe o arquivo do seu sistema operacional, na versão mais recente:
   - **Windows:** arquivo `.exe` (instalador)
   - **macOS:** arquivo `.dmg`
   - **Linux:** arquivo `.AppImage` (não precisa instalar, é só executar) ou `.deb`
3. Instale/abra normalmente. Na primeira execução:
   - **Windows:** o Windows SmartScreen pode avisar "Windows protegeu seu PC" por não reconhecer o autor (o instalador não é assinado digitalmente). Clique em **Mais informações → Executar assim mesmo**.
   - **macOS:** por não haver um certificado de desenvolvedor Apple, o Gatekeeper pode bloquear a abertura. Clique com o botão direito no app → **Abrir** → **Abrir** (só precisa fazer isso uma vez).
4. Crie uma conta (e-mail e senha) direto no app. Os dados ficam salvos automaticamente e sincronizados na nuvem.

> Assinar digitalmente os instaladores (Windows/macOS) exige certificados
> pagos e não é obrigatório para o app funcionar — só evita esses avisos.

---

## 2. Como rodar o projeto localmente (desenvolvimento)

Pré-requisitos: [Node.js 20+](https://nodejs.org).

```bash
npm install
cp .env.example .env
```

Edite o arquivo `.env` com as credenciais do seu projeto Supabase (veja a
seção 3 abaixo para pegar essas chaves):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx
```

Rodar em modo desenvolvimento (abre uma janela do Electron com hot-reload):

```bash
npm run electron:dev
```

Gerar um instalador local, só para o seu sistema operacional:

```bash
npm run dist:win     # Windows
npm run dist:mac     # macOS (precisa rodar num Mac)
npm run dist:linux   # Linux
```

Os arquivos gerados aparecem na pasta `release/`.

---

## 3. Configurar o banco de dados (Supabase)

O app usa o mesmo backend Supabase do projeto original.

1. Crie um projeto em [supabase.com](https://supabase.com) (ou reaproveite o
   que já existe).
2. No painel do projeto, abra **SQL Editor → New query**, cole todo o
   conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste
   repositório e clique em **Run**. Isso cria as tabelas `profiles`,
   `categorias`, `transacoes`, `orcamentos`, as políticas de segurança (RLS —
   cada usuário só vê os próprios dados) e o gatilho que cria categorias
   padrão para cada novo cadastro.
3. Em **Settings → API Keys**, copie a **Project URL** e a **Publishable
   key** (`sb_publishable_...`) — são os dois valores usados em
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

---

## 4. Como lançar uma nova versão (gerar os 3 instaladores automaticamente)

Este repositório já vem com um workflow do GitHub Actions
(`.github/workflows/build.yml`) que compila o app para Windows, macOS e
Linux ao mesmo tempo — usando os servidores do próprio GitHub, então você
não precisa ter um Mac para gerar o instalador de macOS.

**Configuração única (antes do primeiro lançamento):**

Em **Settings → Secrets and variables → Actions → New repository secret**,
cadastre dois secrets no repositório do GitHub:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

(mesmos valores do seu `.env`, vistos na seção 3). O `GITHUB_TOKEN` usado
para publicar a release é gerado automaticamente pelo próprio GitHub, não
precisa configurar nada para ele.

**Para lançar uma nova versão:**

1. Atualize o campo `"version"` em `package.json` (ex.: `1.0.1`).
2. Envie uma tag no formato `vX.Y.Z`:

   ```bash
   git add package.json
   git commit -m "Versão 1.0.1"
   git tag v1.0.1
   git push origin main --tags
   ```

3. Isso dispara o workflow automaticamente. Acompanhe em **Actions**, na aba
   do repositório no GitHub. Quando os 3 jobs (Windows/macOS/Linux)
   terminarem, os instaladores aparecem publicados sozinhos em uma nova
   **Release** (aba **Releases**), pronta para os leitores baixarem.

Você também pode rodar o workflow manualmente (aba **Actions → Build e
publicar instaladores → Run workflow**) sem criar uma tag — nesse caso ele
só gera os instaladores como artefatos de teste, sem publicar uma Release.

---

## 5. Estrutura do projeto

```
electron/main.js     → processo principal do Electron (abre a janela do app)
src/                  → aplicativo React (interface, telas, gráficos)
supabase/schema.sql   → schema completo do banco de dados
.github/workflows/    → automação que gera os instaladores
```

O app é uma SPA em React + TypeScript + Tailwind, empacotada com Electron e
usando o Supabase diretamente pelo navegador embutido (sem servidor próprio)
para autenticação e dados — cada usuário só enxerga os seus próprios
lançamentos, graças às políticas de Row Level Security do Postgres.
