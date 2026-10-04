# PROMPT MESTRE — "Foco" · Dashboard pessoal de tarefas e projetos

> Lê este documento INTEIRO antes de escrever qualquer código. Segue-o à letra.
> Não improvises design. Não inventes dependências. Não simplifiques o que está especificado.
> Quando algo não estiver especificado, escolhe a opção mais simples e documenta em `DECISIONS.md`.

---

## 0. REGRAS ABSOLUTAS (violar qualquer uma = falhar a tarefa)

1. **PROIBIDO CSS puro.** Nenhum ficheiro `.css`/`.scss` com regras de estilo, nenhum `style=""`, nenhum `styles: [...]` em componentes.
   - Único CSS permitido: as 3 diretivas `@tailwind base; @tailwind components; @tailwind utilities;` em `src/styles.css`.
   - Todo o estilo é feito com **classes utilitárias Tailwind** no HTML dos templates.
   - Valores fora da escala usam *arbitrary values* do Tailwind: `rounded-[28px]`, `text-[13px]`, `bg-[#6C5CE7]`.
2. **Sem backend.** Persistência 100% em `localStorage`. Corre só na máquina local (`ng serve`).
3. **Sem bibliotecas de UI** (nada de Angular Material, PrimeNG, Bootstrap). Só Angular + Tailwind + (opcional) `lucide-angular` para ícones.
4. **Standalone components**, **signals**, **novo control flow** (`@if`, `@for`, `@switch`). Proibido `*ngIf`/`*ngFor`, proibido NgModules.
5. **TypeScript `strict: true`.** Proibido `any`. Tudo tipado.
6. Todos os ficheiros devem ser entregues **completos** (nunca "// resto igual").
7. Idioma da UI: **Português (Angola/Portugal)**. Código, nomes de variáveis e ficheiros em **inglês**.
8. No fim de cada fase, corre `ng build` e corrige TODOS os erros antes de avançar.

---

## 1. OBJETIVO DO PRODUTO

Uma plataforma pessoal que me mostra, ao abrir, **exatamente o que tenho de fazer hoje**, para eu não me perder nem ficar sobrecarregado.

Funcionalidades:
- Criar **Projetos** (com tarefas dentro) e **Tarefas** (dentro de um projeto ou soltas).
- Três **categorias**: `professional` (Profissional), `personal` (Pessoal), `household` (Doméstica).
- **Urgência** por tarefa/projeto: `critical`, `high`, `medium`, `low`, e flag `canPostpone` (pode adiar).
- **Dashboard** com: Tarefas de hoje, Pendentes, Urgentes, Próximos passos.
- **Página de vida** (detalhe) de cada projeto e de cada tarefa, com histórico de atividade.
- Entrada de dados por 3 vias: **formulário manual**, **script na consola do browser** (`window.foco`), **importação de JSON** (para um agente de IA gerar).
- Modelo de dados forte e versionado, pronto para trocar `localStorage` por uma API real no futuro (padrão Repository).

---

## 2. STACK E SETUP (comandos exatos)

- Angular **19+** (standalone por defeito), TypeScript strict, **Tailwind CSS 3.4** (não uses v4).

```bash
npm i -g @angular/cli
ng new foco --style=css --routing --ssr=false --strict
cd foco
npm i -D tailwindcss@3.4 postcss autoprefixer
npx tailwindcss init
npm i lucide-angular
```

`src/styles.css` (ÚNICO conteúdo):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`tailwind.config.js` (usa EXATAMENTE isto):
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          DEFAULT: '#6C5CE7',
          600: '#5B4BD6',
          500: '#6C5CE7',
          400: '#8577F0',
          100: '#ECEAFD',
          50: '#F4F3FE',
        },
        ink: { DEFAULT: '#1B1840', 700: '#2E2B55', 500: '#6B6A8A', 400: '#9A9AB5', 300: '#C9C9DA' },
        surface: { page: '#E9EBF3', app: '#F6F7FB', card: '#FFFFFF', line: '#ECECF4' },
        success: { DEFAULT: '#3FBF9A', soft: '#DDF4EC' },
        danger: { DEFAULT: '#F0506E', soft: '#FFE3E9' },
        warn: { DEFAULT: '#F5A524', soft: '#FFF1D6' },
        teal: { tag: '#7CC9B0' },
      },
      borderRadius: { card: '20px', shell: '28px' },
      boxShadow: {
        card: '0 8px 24px -8px rgba(60, 50, 140, 0.10)',
        float: '0 16px 40px -12px rgba(60, 50, 140, 0.25)',
      },
    },
  },
  plugins: [],
};
```

`src/index.html`: adicionar no `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```
e no `<body class="font-sans bg-surface-page text-ink antialiased">`.

---

## 3. MODELO DE DADOS (`src/app/core/models.ts`)

```ts
export type Category = 'professional' | 'personal' | 'household';
export type Urgency = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in_progress' | 'done' | 'postponed';

export interface ActivityEntry {
  id: string;
  at: string;              // ISO datetime
  type: 'created' | 'status_changed' | 'note' | 'postponed' | 'edited' | 'next_step_changed';
  message: string;
}

export interface Task {
  id: string;              // crypto.randomUUID()
  projectId: string | null;
  title: string;
  description: string;
  category: Category;
  urgency: Urgency;
  status: Status;
  canPostpone: boolean;
  dueDate: string | null;  // 'YYYY-MM-DD'
  nextStep: string;        // próximo passo concreto (1 frase)
  estimateMinutes: number | null;
  tags: string[];
  activity: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: Category;
  urgency: Urgency;
  status: 'active' | 'paused' | 'done';
  canPostpone: boolean;
  dueDate: string | null;
  nextStep: string;
  color: string;           // hex, da paleta de projetos (secção 6.9)
  activity: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  schemaVersion: 1;
  projects: Project[];
  tasks: Task[];
  settings: { theme: 'light' | 'dark'; userName: string };
}
```

---

## 4. ARQUITETURA (cria EXATAMENTE esta estrutura)

```
src/app/
  core/
    models.ts
    storage.repository.ts      # classe abstrata DataRepository + LocalStorageRepository
    data.store.ts              # signals + computed + ações (CRUD)
    seed.ts                    # dados de exemplo (só carregados se store vazio)
    console-api.ts             # window.foco
    import.service.ts          # validação + import JSON
    date.utils.ts
  layout/
    shell.component.ts         # sidebar + topbar + <router-outlet>
    sidebar.component.ts
    topbar.component.ts
  shared/
    ui/
      card.component.ts
      badge-urgency.component.ts
      badge-category.component.ts
      progress-ring.component.ts
      empty-state.component.ts
      task-row.component.ts
      modal.component.ts
      task-form.component.ts
      project-form.component.ts
  pages/
    dashboard/dashboard.page.ts
    projects/projects.page.ts
    project-detail/project-detail.page.ts
    tasks/tasks.page.ts
    task-detail/task-detail.page.ts
    import/import.page.ts
  app.routes.ts
  app.config.ts
  app.component.ts
```

Rotas:
| Caminho | Página |
|---|---|
| `/` | Dashboard |
| `/projetos` | Lista de projetos (filtros por categoria) |
| `/projetos/:id` | Página de vida do projeto |
| `/tarefas` | Todas as tarefas (filtros) |
| `/tarefas/:id` | Página de vida da tarefa |
| `/importar` | Importar/exportar JSON |

Usa **lazy loading** com `loadComponent`.

### 4.1 Persistência (padrão Repository)
```ts
export abstract class DataRepository {
  abstract load(): AppData;
  abstract save(data: AppData): void;
}
```
`LocalStorageRepository` usa a chave **`foco:data:v1`**. `load()` faz `try/catch` + `JSON.parse`; se falhar ou não existir, devolve dados vazios válidos. Registar com `{ provide: DataRepository, useClass: LocalStorageRepository }` em `app.config.ts`. Assim, no futuro, basta criar `ApiRepository`.

### 4.2 Store (`data.store.ts`)
- `@Injectable({ providedIn: 'root' })`.
- Estado em `signal<AppData>`. Um `effect()` grava no repositório a cada alteração.
- `computed()` obrigatórios:
  - `todayTasks`: status ≠ `done` e (`dueDate === hoje` OU `dueDate < hoje` [atrasadas] OU urgência `critical`).
  - `pendingTasks`: status ∈ `todo | in_progress | postponed`.
  - `urgentTasks`: urgência `critical|high`, status ≠ `done`, ordenadas por urgência e depois `dueDate`.
  - `nextSteps`: lista de `{ kind:'task'|'project', id, title, nextStep, urgency }` onde `nextStep` não está vazio, máx. 6 itens, ordenados por urgência.
  - `statsByCategory`: por categoria → `{ total, done, percent }`.
- Ações: `addProject`, `updateProject`, `deleteProject` (apaga também as tarefas dele, com confirmação), `addTask`, `updateTask`, `deleteTask`, `setTaskStatus`, `postponeTask(id, newDate)`, `addNote(entity, id, text)`, `replaceAll(data)`, `exportJson()`.
- Toda alteração acrescenta uma `ActivityEntry` e atualiza `updatedAt`.
- Ordem de urgência: `critical=0, high=1, medium=2, low=3`.

### 4.3 Script de consola (`console-api.ts`)
No arranque (`APP_INITIALIZER` ou construtor do `AppComponent`) expor `window.foco` com:
```ts
foco.addTask({ title, category?, urgency?, projectName?, dueDate?, nextStep?, description?, canPostpone?, estimateMinutes?, tags? })
foco.addProject({ name, category?, urgency?, dueDate?, nextStep?, description? })
foco.import(jsonObjectOrString)   // mesmo formato da secção 5
foco.list()                       // console.table das tarefas pendentes
foco.today()                      // console.table das de hoje
foco.export()                     // devolve o JSON completo
foco.clear()                      // pede confirm() antes de apagar tudo
```
- `projectName`: se o projeto existir (comparação case-insensitive) reutiliza; senão cria automaticamente na mesma categoria.
- Defaults: `category='professional'`, `urgency='medium'`, `status='todo'`, `canPostpone=true`.
- Declarar tipagem global: `declare global { interface Window { foco: FocoConsoleApi } }`.

---

## 5. FORMATO DE IMPORTAÇÃO (para IA/scripts)

Página `/importar` com `<textarea>` + botão "Importar" + botão "Exportar JSON" (download) + botão "Copiar prompt para IA".

Formato aceite (validar manualmente, sem libs; mostrar erros claros por campo):
```json
{
  "projects": [
    {
      "name": "Loja Nerd",
      "category": "personal",
      "urgency": "high",
      "dueDate": "2026-10-20",
      "nextStep": "Definir catálogo inicial de 10 produtos",
      "description": "Marca de acessórios tech"
    }
  ],
  "tasks": [
    {
      "title": "Integrar API real no destino-mussulo",
      "projectName": "Loja Nerd",
      "category": "professional",
      "urgency": "critical",
      "dueDate": "2026-10-05",
      "nextStep": "Trocar mock service por HttpClient",
      "canPostpone": false,
      "estimateMinutes": 90,
      "tags": ["angular", "api"]
    }
  ]
}
```
Regras: campos inválidos de enum → erro (não adivinhar). IDs gerados pela app. Importação é **aditiva** (nunca apaga).

O botão "Copiar prompt para IA" copia este texto para a área de transferência:
> "Converte a lista de tarefas abaixo em JSON no formato do Foco (projects[] e tasks[]). category ∈ professional|personal|household. urgency ∈ critical|high|medium|low. dueDate em YYYY-MM-DD. Responde SÓ com JSON válido."

---

## 6. DESIGN — ESPECIFICAÇÃO PRECISA (baseada na imagem de referência)

O estilo é: **SaaS dashboard moderno, claro, suave, cantos muito arredondados, cartões brancos flutuantes com sombra difusa, roxo como cor de destaque, tipografia grande e arejada.**

### 6.1 Tokens (já no tailwind.config.js)
| Uso | Valor | Classe |
|---|---|---|
| Fundo da página | `#E9EBF3` | `bg-surface-page` |
| Fundo da app (shell) | `#F6F7FB` | `bg-surface-app` |
| Cartão | `#FFFFFF` | `bg-white` |
| Roxo principal | `#6C5CE7` | `bg-brand` |
| Roxo claro (fundos de ícone/chips) | `#ECEAFD` | `bg-brand-100` |
| Texto principal (azul-marinho) | `#1B1840` | `text-ink` |
| Texto secundário | `#6B6A8A` | `text-ink-500` |
| Texto terciário | `#9A9AB5` | `text-ink-400` |
| Bordas | `#ECECF4` | `border-surface-line` |
| Urgente (rosa) | `#F0506E` / fundo `#FFE3E9` | `text-danger bg-danger-soft` |
| Sucesso (verde) | `#3FBF9A` / fundo `#DDF4EC` | `text-success bg-success-soft` |
| Tag verde-azulada | `#7CC9B0` | `bg-teal-tag` |
| Botão escuro | `#1B1840` | `bg-ink text-white` |

### 6.2 Tipografia (Plus Jakarta Sans)
| Elemento | Classes |
|---|---|
| Saudação H1 ("Olá, Zua! O que tens planeado para hoje?") | `text-[36px] leading-[44px] font-extrabold tracking-tight text-ink` |
| Subtítulo da saudação | `text-[14px] leading-[22px] text-ink-500 max-w-[420px]` |
| Título de cartão (ex.: "Notificações", "Tarefas de hoje") | `text-[16px] font-bold text-ink` |
| Título de item/tarefa | `text-[14px] font-semibold text-ink` |
| Texto secundário | `text-[12px] text-ink-500` |
| Micro-texto / legendas | `text-[11px] text-ink-400` |
| Botão | `text-[12px] font-semibold` |
| Tab da navbar | `text-[13px] font-medium` |

### 6.3 Shell (moldura geral)
- `<body>`: `min-h-screen bg-surface-page p-4 md:p-6`.
- Contentor da app: `relative mx-auto flex min-h-[calc(100vh-48px)] max-w-[1440px] overflow-hidden rounded-shell bg-surface-app shadow-card`.
- Padding interno do conteúdo (à direita da sidebar): `flex-1 px-8 py-6 md:px-10`.

### 6.4 Sidebar (coluna roxa à esquerda)
- Largura: `w-[72px]`, `shrink-0`, altura total.
- Fundo: `bg-brand`. Forma: `rounded-br-[48px] rounded-tr-[48px]` em `lg`, com `my-10` para ficar "flutuante" (como na imagem: faixa roxa curva que não toca topo/fundo): `my-10 ml-0 rounded-r-[40px] py-6`.
- Layout: `flex flex-col items-center gap-3`.
- Cada ícone: botão `h-11 w-11 rounded-2xl grid place-items-center text-white/70 hover:bg-white/15 hover:text-white transition`.
- Ícone ATIVO: `bg-white text-brand shadow-float`.
- Tamanho do ícone: `h-5 w-5` (stroke 1.75).
- Itens (ordem): Dashboard (`layout-grid`), Projetos (`folder-kanban`), Tarefas (`check-square`), Calendário (`calendar-days`), Importar (`upload`), Definições (`settings`) — este último com `mt-auto`.
- Em ecrãs `< lg`: sidebar passa a barra inferior fixa (`fixed bottom-4 inset-x-4 h-16 flex-row rounded-3xl`).

### 6.5 Topbar
- Linha: `flex items-center justify-between gap-4`.
- Esquerda — tabs: "Dashboard", "Projetos", "Tarefas" (`flex items-center gap-6`). Tab ativa: `text-ink font-semibold` com ícone; inativa: `text-ink-500 hover:text-ink`.
- Centro — pesquisa: `h-10 w-[260px] rounded-xl border border-surface-line bg-white px-4 text-[13px] placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30` (placeholder "Pesquisar tarefa ou projeto"). Filtra por título em tempo real e navega ao resultado.
- Direita (`flex items-center gap-3`):
  - Toggle claro/escuro: pílula `h-9 rounded-xl bg-white p-1 flex`; segmento ativo `rounded-lg bg-brand-100 text-brand px-3 text-[12px] font-semibold`; inativo `px-3 text-ink-500 text-[12px]`.
  - Botão exportar: `h-9 rounded-xl border border-surface-line bg-white px-4 text-[12px] font-semibold text-ink-500`.
  - **Botão primário "Nova tarefa"**: `h-10 rounded-xl bg-ink px-5 text-[13px] font-semibold text-white hover:bg-ink-700 shadow-card`. Abre o modal de tarefa.

### 6.6 Cabeçalho do Dashboard
- Margem superior: `mt-8`. Grid: `grid grid-cols-12 gap-5`.
- Coluna esquerda (`col-span-12 lg:col-span-5`): saudação (H1) com o nome vindo de `settings.userName` (default "Zua"). A hora define o texto: manhã "Bom dia", tarde "Boa tarde", noite "Boa noite". Subtítulo: "Aqui está o que precisas de fazer hoje. Foca-te numa coisa de cada vez."
- Ao lado, 3 **cartões-resumo** (`col-span-12 lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-5`), cada um:
  `rounded-card bg-white p-5 shadow-card flex flex-col justify-between h-[160px]`
  - Topo: ícone dentro de `h-11 w-11 rounded-2xl bg-brand-100 text-brand grid place-items-center`.
  - Número: `text-[32px] font-extrabold text-ink leading-none`.
  - Legenda: `text-[13px] font-semibold text-ink` + subtexto `text-[11px] text-ink-400`.
  - Os 4 cartões: **Hoje**, **Pendentes**, **Urgentes**, **Concluídas esta semana**. O de "Urgentes" usa `bg-danger-soft text-danger` no ícone.

### 6.7 Grelha principal do Dashboard
Abaixo do cabeçalho: `mt-5 grid grid-cols-12 gap-5`. Todos os cartões: **`rounded-card bg-white p-5 shadow-card`** (Componente `<app-card>`; cabeçalho do cartão: `flex items-center justify-between mb-4`, título `text-[16px] font-bold`, ação à direita `text-[12px] text-ink-400 hover:text-brand`).

**Linha 1**
1. **Tarefas de hoje** (`col-span-12 lg:col-span-5`): lista de `<app-task-row>`. Cada linha:
   `flex items-center gap-4 rounded-2xl px-3 py-3 hover:bg-surface-app transition`
   - Checkbox redondo: `h-5 w-5 rounded-full border-2 border-ink-300`; marcado: `bg-brand border-brand` com check branco.
   - Título `text-[14px] font-semibold` (riscado e `text-ink-400` quando `done`).
   - Linha 2: `text-[11px] text-ink-400` → "projeto · prazo".
   - À direita: badge de urgência + badge de categoria.
   - Linha com sombra `shadow-float bg-white` quando for a tarefa em foco/hover (como o cartão elevado da imagem).
2. **Urgentes** (`col-span-12 md:col-span-6 lg:col-span-4`): lista de tarefas críticas/altas. Cada item é um mini-cartão `rounded-2xl border border-surface-line p-4`: tags no topo (categoria `text-[10px]`), título `text-[15px] font-bold leading-snug`, rodapé com badge de urgência à esquerda e prazo à direita. Botão tracejado no fim: `rounded-2xl border-2 border-dashed border-brand/30 bg-brand-50 py-4 text-[13px] font-semibold text-brand` com ícone `+` num quadrado `h-6 w-6 rounded-md bg-brand text-white` ("Adicionar tarefa"), exatamente como o bloco "Add new assignment" da imagem.
3. **Calendário / semana** (`col-span-12 md:col-span-6 lg:col-span-3`): título = mês e ano (ex.: "Outubro 2026") com setas `‹ ›` em círculos `h-6 w-6 rounded-full bg-surface-app`. Faixa de 7 dias (`grid grid-cols-7 text-center`): letra do dia `text-[10px] text-ink-400` + número `text-[12px] font-semibold`; **dia selecionado**: `h-7 w-7 rounded-full bg-brand text-white`. Abaixo, listagem de tarefas do dia selecionado com ações (ver secção 6.7.1).

**Linha 2**
4. **Próximos passos** (`col-span-12 lg:col-span-5`): cada item é `flex items-start gap-3`: bolinha `mt-1.5 h-2 w-2 rounded-full bg-brand`; texto do próximo passo `text-[13px] font-semibold`; abaixo "de {projeto/tarefa}" `text-[11px] text-ink-400`. Clicar navega à página de vida.
5. **Cartão roxo "Modo foco"** (`col-span-12 md:col-span-6 lg:col-span-3`): substitui o "Go premium!" da imagem.
   `rounded-card bg-brand p-6 text-white flex flex-col items-center text-center gap-3 shadow-float`
   - Título `text-[20px] font-extrabold`; texto `text-[12px] text-white/80`; botão `h-10 rounded-xl bg-ink px-5 text-[13px] font-semibold text-white`.
   - Conteúdo: "Faz só UMA coisa agora" + mostra a tarefa nº1 (a mais urgente) e botão "Começar" que a coloca `in_progress`.
6. **Progresso por categoria** (`col-span-12 md:col-span-6 lg:col-span-4`): 3 mini-cartões lado a lado (`grid grid-cols-3 gap-3`), cada um `rounded-2xl border border-surface-line p-3`: **anel de progresso** (SVG, ver 6.8), rótulo `text-[11px] font-bold text-ink`, sub `text-[10px] text-ink-400` ("3 de 8 feitas"). Categorias: Profissional, Pessoal, Doméstica.

### 6.7.1 Listagem de tarefas do dia (calendário)
Ao clicar num dia do calendário, a secção abaixo mostra a listagem de todas as tarefas desse dia (pendentes e concluídas).
- Cabeçalho: `flex items-center justify-between mb-3` com título `text-[16px] font-bold text-ink` ("Tarefas para {data}") e botão `h-9 rounded-xl bg-brand px-4 text-[12px] font-semibold text-white transition hover:bg-brand-600` "Adicionar tarefa".
- Cada tarefa: `flex items-center gap-4 rounded-2xl border border-surface-line bg-surface-card px-4 py-3 transition hover:shadow-card`
  - Checkbox redondo `h-4 w-4 rounded accent-brand` para alternar done/todo
  - Bloco central `min-w-0 flex-1`: título `truncate text-[14px] font-semibold text-ink` (riscado + `text-ink-400` se done), sub `text-[11px] text-ink-400` com data e categoria
  - Ações à direita `shrink-0`: link "Editar" `text-[11px] text-brand font-semibold hover:underline` e "Eliminar" `text-[11px] text-danger font-semibold hover:underline`
- Estado vazio: `<app-empty-state icon="calendar-days" title="Sem tarefas neste dia" message="Adiciona a tua primeira tarefa para {data}." actionLabel="Adicionar tarefa" (actionClick)="addTaskForDate()" />`
- O botão "Adicionar tarefa" abre o modal de tarefa com o `dueDate` preenchido para o dia selecionado.

### 6.8 Componentes reutilizáveis
- **Badge urgência** (`rounded-full px-2.5 py-1 text-[10px] font-bold`):
  - `critical`: `bg-danger-soft text-danger` → "Crítica"
  - `high`: `bg-warn-soft text-warn` → "Alta"
  - `medium`: `bg-brand-100 text-brand` → "Média"
  - `low`: `bg-success-soft text-success` → "Baixa"
  - Se `canPostpone`, mostrar ao lado um chip `text-[10px] text-ink-400` com ícone `clock` "Pode adiar".
- **Badge categoria** (`rounded-md px-2 py-1 text-[10px] font-semibold text-white`): Profissional `bg-brand`, Pessoal `bg-teal-tag`, Doméstica `bg-[#F5A524]`.
- **Anel de progresso**: SVG `h-[44px] w-[44px]` com `viewBox="0 0 36 36"`, círculo de fundo `stroke-surface-line`, círculo de progresso `stroke-brand` (`stroke-linecap-round`, `stroke-dasharray` calculado em TS, `-rotate-90`), `stroke-width=4`. Percentagem no centro `text-[10px] font-bold`. Cor do anel: ≥60% `stroke-success`, <60% `stroke-brand`, atrasado `stroke-danger`.
- **Botão primário**: `h-10 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-600 transition`.
- **Botão secundário**: `h-10 rounded-xl bg-brand-100 px-5 text-[13px] font-semibold text-brand hover:bg-brand-50`.
- **Input/select/textarea**: `w-full rounded-xl border border-surface-line bg-white px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30`. Label: `mb-1.5 block text-[12px] font-semibold text-ink-700`.
- **Modal**: overlay `fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm p-4`; painel `w-full max-w-[560px] rounded-shell bg-white p-8 shadow-float`; fecha com `Esc` e clique no overlay.
- **Empty state**: componente padrão `<app-empty-state>` com:
  - Ícone: `h-14 w-14 rounded-2xl bg-brand-100 text-brand grid place-items-center mb-4` com `<lucide-icon [name]="icon()" class="h-6 w-6" [strokeWidth]="1.75" />`. O ícone é parametrizado por input; padrão `circle-check`.
  - Título: `text-[15px] font-bold text-ink mb-1`
  - Mensagem: `text-[12px] text-ink-500 mb-4 max-w-[280px]`
  - Botão de ação (opcional): `h-10 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-600 transition`
  - Usar em TODOS os estados vazios da app: dashboard sem tarefas, calendário sem tarefas no dia, projetos sem projetos, tarefas sem tarefas, detalhes sem atividade.
  - Exemplos de ícones por contexto: `calendar-days` (calendário vazio), `folder-kanban` (sem projetos), `square-check` (sem tarefas), `circle-check` (sucesso/dia livre).
- Hover/transições: `transition duration-150`. Foco visível sempre (`focus-visible:ring-2 focus-visible:ring-brand/40`).

### 6.9 Paleta de cores de projeto
`#6C5CE7, #3FBF9A, #F0506E, #F5A524, #3B82F6, #A855F7, #14B8A6, #EF8354`. Mostrar como bolinha `h-3 w-3 rounded-full` ao lado do nome do projeto.

### 6.10 Modo escuro
Toggle altera `data-theme="dark"` no `<html>` e grava em `settings.theme`. Usar variantes `dark:`:
- Página `dark:bg-[#0F0E24]`, shell `dark:bg-[#14132E]`, cartões `dark:bg-[#1C1B3D]`, bordas `dark:border-white/10`, texto `dark:text-white`, secundário `dark:text-white/60`.
- Aplicar `dark:` em TODOS os componentes (não deixar nenhum branco no escuro).

---

## 7. PÁGINAS DE VIDA

### 7.1 `/projetos/:id`
- Cabeçalho: bolinha de cor + nome (`text-[28px] font-extrabold`), badges (categoria, urgência, estado), prazo, botão "Editar" e "Apagar".
- Barra de progresso: `h-2 rounded-full bg-surface-line` com preenchimento `bg-brand rounded-full` (largura = % de tarefas concluídas).
- Cartão **Próximo passo** destacado: `rounded-card bg-brand-50 border border-brand/20 p-5`, editável inline.
- Lista de tarefas do projeto (com checkbox) + botão tracejado "Adicionar tarefa a este projeto".
- **Linha do tempo** (atividade): lista vertical com linha `border-l-2 border-surface-line pl-5`, cada entrada com bolinha `h-2.5 w-2.5 rounded-full bg-brand -ml-[27px]`, mensagem `text-[13px]`, data `text-[11px] text-ink-400`.
- Campo "Adicionar nota" (textarea + botão) que cria `ActivityEntry` tipo `note`.

### 7.2 `/tarefas/:id`
Igual, mas com: título editável, descrição, estado (select), urgência (select), `canPostpone` (toggle), prazo (input date), estimativa, tags (chips `rounded-full bg-brand-100 px-3 py-1 text-[11px] text-brand`), botão **"Adiar"** (pede nova data; só ativo se `canPostpone`; se for falso mostrar aviso "Esta tarefa não pode ser adiada") e **"Concluir"**.

### 7.3 `/projetos` e `/tarefas`
- Filtros em chips (`rounded-full px-4 h-9 text-[12px] font-semibold`; ativo `bg-brand text-white`, inativo `bg-white text-ink-500 border border-surface-line`): Todas | Profissional | Pessoal | Doméstica, e filtro de urgência.
- Projetos em grelha `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5` de cartões com: bolinha, nome, descrição (2 linhas, `line-clamp-2`), anel de progresso, próximo passo, badges.
- Tarefas em lista agrupada por categoria.

---

## 8. COMPORTAMENTO E REGRAS DE NEGÓCIO

1. Ao abrir a app pela primeira vez (store vazio): carregar `seed.ts` com 1 projeto e 4 tarefas de exemplo (uma por categoria + uma crítica) para ver o design preenchido. Botão em Definições "Limpar dados de exemplo".
2. Tarefa `critical` aparece SEMPRE em "Hoje", mesmo sem prazo.
3. Tarefa com `dueDate` no passado e não concluída = **atrasada**: mostrar prazo em `text-danger font-semibold` com ícone `alert-circle`.
4. Concluir tarefa: `status='done'`, `completedAt=now`, registar atividade, animação suave de risco no título.
5. Se todas as tarefas de um projeto estiverem concluídas, sugerir (toast) marcar o projeto como concluído.
6. Confirmar (`confirm()` nativo está ok) antes de apagar.
7. Atalhos: `N` abre "Nova tarefa"; `/` foca a pesquisa; `Esc` fecha modal.
8. Datas formatadas em `pt-PT` via `Intl.DateTimeFormat`. Nunca usar libs de datas.
9. Toda a lista deve ter `track item.id` no `@for`.
10. Acessibilidade: botões com `aria-label`, inputs com `<label>`, contraste AA.

---

## 9. FASES DE EXECUÇÃO (faz por esta ordem; valida com `ng build` no fim de cada)

1. **Setup**: projeto, Tailwind, fonte, `tailwind.config.js`, rotas vazias.
2. **Core**: `models.ts`, repository, store com signals/computed, seed, utils de datas.
3. **Shell**: sidebar + topbar + dark mode.
4. **UI partilhada**: card, badges, progress-ring, task-row, modal, formulários.
5. **Dashboard** (secção 6.6 e 6.7) — comparar visualmente com a imagem de referência.
6. **Projetos e Tarefas** (listas + páginas de vida).
7. **Importar + `window.foco`**.
8. **Polimento**: estados vazios, atalhos, responsivo (testar 375px, 768px, 1280px, 1440px), `ng build --configuration production` sem erros nem warnings.

---

## 10. CHECKLIST FINAL (confirma cada ponto no fim, em `DECISIONS.md`)

- [ ] Zero CSS escrito à mão (só as 3 diretivas Tailwind em `styles.css`).
- [ ] Zero `any`, zero `*ngIf/*ngFor`, zero NgModules.
- [ ] Dados persistem após recarregar a página.
- [ ] `foco.addTask({...})` na consola cria a tarefa e a UI atualiza sem recarregar.
- [ ] Importação de JSON válido funciona; inválido mostra erros por campo.
- [ ] Modo escuro cobre 100% dos componentes.
- [ ] Dashboard mostra: Hoje, Pendentes, Urgentes, Próximos passos, Progresso por categoria.
- [ ] Páginas de vida de projeto e tarefa com linha do tempo e notas.
- [ ] Responsivo sem scroll horizontal.
- [ ] `ng build --configuration production` passa limpo.

> Se tiveres dúvida em algum ponto, **não improvises**: escolhe a opção mais simples, segue o design acima e regista a decisão em `DECISIONS.md`.