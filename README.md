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
3. Instale/abra normalmente. É esperado que apareça um aviso de segurança na
   primeira vez — veja abaixo exatamente o que fazer em cada sistema.
4. Crie uma conta (e-mail e senha) direto no app. Os dados ficam salvos
   automaticamente e sincronizados na nuvem.

### Por que aparece um aviso de segurança (e por que é seguro seguir em frente)

O Método Simples não tem uma "assinatura digital" — um selo pago que
comprova pro Windows e pro Mac quem é o autor do programa. Sem esse selo,
os dois sistemas mostram um aviso por padrão para *qualquer* programa
baixado da internet, mesmo sendo seguro. Isso não significa que o app tem
vírus — é só o computador avisando "eu não conheço quem fez isso".

**No Windows:**

1. Depois de baixar o arquivo `.exe`, clique nele duas vezes para abrir o
   instalador.
2. Vai aparecer uma tela azul escrita **"O Windows protegeu o computador"**,
   com um botão **Não executar**.
3. Clique no link pequeno escrito **"Mais informações"** (fica logo abaixo
   do título da tela).
4. Agora vai aparecer um botão novo, **"Executar assim mesmo"** — clique
   nele.
5. O instalador do Método Simples abre normalmente. Isso só acontece uma
   vez, na primeira instalação de cada versão nova.

**No macOS:**

1. Depois de baixar o arquivo `.dmg`, abra-o e arraste o ícone do Método
   Simples para a pasta **Aplicativos**, como de costume.
2. Vá até a pasta **Aplicativos** (pelo Finder) e, em vez de dar duplo
   clique, clique **com o botão direito do mouse** (ou dois dedos no
   trackpad) em cima do ícone do Método Simples.
3. No menu que aparece, clique em **Abrir**.
4. Vai aparecer um aviso perguntando se você tem certeza que quer abrir —
   clique em **Abrir** de novo.
5. Pronto — a partir daí, o app abre normalmente com um duplo clique, como
   qualquer outro programa.

> Se quiser, dá pra pagar por certificados oficiais (Apple e Microsoft)
> para esses avisos pararem de aparecer — mas isso tem um custo anual e não
> é obrigatório para o app funcionar direitinho. Por enquanto, seguimos sem
> esse custo.

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
2. No painel do projeto, abra **SQL Editor → New snippet** (não é "New
   folder", que só organiza pastas, nem "New logs query", que é outra
   ferramenta para consultar logs do projeto), cole todo o
   conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste
   repositório e clique em **Run**. Isso cria as tabelas `profiles`,
   `categorias`, `transacoes`, `orcamentos`, as políticas de segurança (RLS —
   cada usuário só vê os próprios dados) e o gatilho que cria categorias
   padrão para cada novo cadastro.
3. Em **Settings → API Keys**, copie a **Project URL** e a **Publishable
   key** (`sb_publishable_...`) — são os dois valores usados em
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Em **Authentication → URL Configuration → Redirect URLs**, adicione
   `metodosimples://redefinir-senha` à lista. **Esse passo é obrigatório** —
   sem ele, o Supabase recusa o link de "esqueci minha senha" e o e-mail de
   redefinição não funciona (o resto do app funciona normalmente sem isso,
   só esse recurso específico depende dele).

**Se seu projeto Supabase já existia antes** (rodou o `schema.sql` numa
versão anterior do app): em vez do `schema.sql` inteiro, rode os arquivos de
migração na ordem — [`supabase/migracao_v2.sql`](./supabase/migracao_v2.sql)
(subcategorias, parcelamento), depois
[`supabase/migracao_v3.sql`](./supabase/migracao_v3.sql) (contas) e depois
[`supabase/migracao_v4.sql`](./supabase/migracao_v4.sql) (recorrências, metas
de economia e os campos de fatura do cartão de crédito) — cada um só
adiciona o que é novo, sem apagar nada do que já existe.

> Nota sobre a notificação de vencimentos: na primeira vez que o app for
> abrir um aviso de conta a vencer, o sistema operacional pode perguntar se
> permite notificações do "MetodoSimples" — é só clicar em Permitir.

> Nota de segurança (a partir da versão 1.0.12): a sessão de login passou a
> ser guardada criptografada (usando o cofre de senhas do próprio sistema
> operacional) em vez de texto puro. Quem já estava logado numa versão
> anterior vai precisar entrar de novo uma única vez depois de atualizar —
> depois disso, o app volta a manter a pessoa logada normalmente. O link de
> "esqueci minha senha" só funciona no programa instalado (não em
> `npm run electron:dev`), porque depende de um protocolo (`metodosimples://`)
> que só fica registrado no sistema operacional depois da instalação.

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
