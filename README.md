## TaskMaster - Kanban de Projetos (React + Node + MongoDB)

Aplicação de gerenciamento de projetos e tarefas estilo Trello/Asana, construída com:

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Banco de dados**: MongoDB (via Mongoose)

---

## Demonstração rápida (como usar)

1. **Abrir a aplicação**
   - Com backend e frontend rodando (veja abaixo), acesse: `http://localhost:5173`.

2. **Projetos**
   - A sidebar à esquerda mostra a lista de projetos.
   - Se for a primeira vez, é criado automaticamente o projeto **“Meu primeiro quadro”** com 3 colunas.
   - Botão **“Novo projeto”**:
     - Abre prompts para nome e descrição.
     - Cria o projeto e seleciona automaticamente.
   - Botão **“Excluir projeto”**:
     - Remove o projeto atual, suas colunas e tarefas (ação irreversível).

3. **Board Kanban**
   - Cada projeto tem um quadro com três colunas:
     - **A Fazer**
     - **Em Progresso**
     - **Concluído**
   - No topo do board existe uma área **“Nova tarefa...”**:
     - Campo de texto para o título da tarefa.
     - Select para escolher a coluna (status).
     - Botão **“Adicionar”** para criar a tarefa.

4. **Tarefas**
   - Cada card de tarefa mostra:
     - Título
     - Descrição (quando existe)
   - Ações disponíveis em cada card:
     - **Editar** – abre prompts para alterar título e descrição.
     - **Deletar** – pede confirmação antes de excluir.
   - As tarefas podem ser **arrastadas e soltas** entre colunas:
     - O status e a posição são atualizados no backend.

---

## Como rodar o projeto localmente

### 1. Pré-requisitos (o que precisa estar instalado)

- **Git**
  - Para clonar o repositório: `https://git-scm.com/downloads`
- **Node.js (LTS) + npm**
  - Para rodar o backend e o frontend: `https://nodejs.org`
- **MongoDB**
  - Opção 1 (mais simples): **MongoDB Community** instalado localmente (`mongodb://localhost:27017`)
  - Opção 2: **MongoDB Atlas** (banco na nuvem) com uma connection string própria
- (Opcional, mas recomendado) **VS Code / Cursor**
  - Para editar o código e ter syntax highlighting.

---

### 2. Clonar o projeto do GitHub

No terminal (PowerShell, cmd ou bash):

```bash
git clone https://github.com/SEU-USUARIO/TaskMaster.git
cd TaskMaster
```

> Substitua `SEU-USUARIO` pela sua conta do GitHub e o nome do repositório, se for diferente.

---

### 3. Backend

1. Vá para a pasta do backend:

```bash
cd backend
```

2. Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite se precisar trocar a `MONGO_URI`.

3. Instale as dependências (se ainda não instalou):

```bash
npm install
```

4. Suba o servidor em modo desenvolvimento:

```bash
npm run dev
```

O backend ficará em `http://localhost:4000`.

Ao chamar `GET /api/projects` pela primeira vez, um projeto inicial padrão é criado automaticamente com três colunas:

- A Fazer
- Em Progresso
- Concluído

---

### 4. Frontend

1. Em outro terminal, vá para a pasta do frontend:

```bash
cd frontend
```

2. Instale as dependências (se ainda não instalou):

```bash
npm install
```

3. Suba o Vite:

```bash
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).

---

### 5. Resumo rápido do fluxo para quem baixou do GitHub

1. **Clonar o repo**
   ```bash
   git clone https://github.com/SEU-USUARIO/TaskMaster.git
   cd TaskMaster
   ```
2. **Configurar backend**
   ```bash
   cd backend
   cp .env.example .env
   # (edite MONGO_URI se precisar)
   npm install
   npm run dev
   ```
3. **Configurar frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
4. **Usar o app**
   - Abrir `http://localhost:5173`
   - Criar/gerenciar projetos e tarefas pelo UI.

## Funcionalidades principais

- Lista de **projetos** na sidebar.
- Criação de **novo projeto** e **exclusão de projeto** direto pela interface.
- Board Kanban com 3 colunas padrão.
- Criação, edição, exclusão e movimentação (drag and drop) de tarefas entre colunas.

---

## Scripts importantes

### Backend (`backend/package.json`)

- `npm run dev` – servidor em TypeScript com recarregamento.
- `npm run build` – compila para `dist`.
- `npm start` – roda a versão compilada (`dist/server.js`).

### Frontend (`frontend/package.json`)

- `npm run dev` – modo desenvolvimento.
- `npm run build` – build de produção.
- `npm run preview` – preview do build.

