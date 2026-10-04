# DECISIONS.md

## Correção 2 — Foco (dark mode, ícones, páginas internas)

### P0 — Dark mode com tokens semânticos
- **tailwind.config.js**: substituído por configuração com variáveis CSS semânticas (`--c-brand`, `--c-ink`, `--c-surface-card`, etc.) definidas via plugin `addBase` em `:root` e `[data-theme="dark"]`. O `darkMode` foi mantido como `['class', '[data-theme="dark"]']`.
- **Todas as classes `dark:`** foram removidas dos templates. As cores agora mudam automaticamente via variáveis CSS.
- **Todos os `bg-white`** em cartões, inputs, selects, modais, etc. foram substituídos por `bg-surface-card`. Exceções mantidas: item ativo da sidebar (`bg-white`), botões sobre `bg-brand`/`bg-strong` (texto `text-white`), bolinha do toggle, badges de categoria.
- **`text-brand`** (como cor de texto) substituído por `text-brand-fg` em todo o lado.
- **`bg-ink`** em botões escuros substituído por `bg-strong`.
- **`bg-ink/40`** no overlay do modal substituído por `bg-black/50`.

### P0 — ThemeService
- Criado `core/theme.service.ts` com `theme = computed(() => store.data().settings.theme)`, `set()` e `effect()` que aplica `data-theme` no `document.documentElement`.
- `TopbarComponent` agora usa `ThemeService` em vez de gerir o tema localmente.

### P0 — Ícones
- Criado `core/icons.ts` com todos os ícones usados na app.
- `app.config.ts` atualizado para `LucideAngularModule.pick(APP_ICONS)`.
- Corrigido nome `check-square` → `square-check` na topbar.
- `LucideAngularModule` adicionado aos imports de todos os componentes que usam `<lucide-icon>`.

### P0 — Sweep de componentes
- **Shell**: `overflow-hidden` → `overflow-clip` para permitir `sticky` na sidebar.
- **Sidebar**: adicionadas classes `lg:sticky lg:top-10 lg:self-start lg:h-[calc(100vh-128px)] lg:max-h-[720px]` e `lg:mt-auto` no item Definições.
- **Topbar**: removidas todas as classes `dark:`, pesquisa e botão Exportar com `bg-surface-card`.
- **Dashboard**: 4 cartões de stats com `bg-surface-card` (removido `dark:bg-[#1C1B3D]`), heading sem `dark:text-white`, botão "Adicionar tarefa" com receita oficial, Modo foco com ícone `sparkles` e botões `bg-strong`.
- **CardComponent**: removido `dark:bg-[#1C1B3D]`.
- **ModalComponent**: `bg-ink/40` → `bg-black/50`, `bg-white` → `bg-surface-card`.
- **Todos os formulários** (task-form, project-form, task-detail, project-detail): inputs com `bg-surface-card`.

### P1 — Badges invisíveis
- `BadgeUrgencyComponent` e `BadgeCategoryComponent` agora usam métodos que retornam strings de classes literais (`urgencyClass()`, `categoryClass()`), eliminando o problema de Tailwind não detetar classes dinâmicas.
- Cabeçalhos das páginas de detalhe com link de volta, badges, estado e data.

### P1 — Linha do tempo
- Implementado template de timeline nos detalhes de projeto e tarefa com `<ol>`, bolinha `bg-brand`, linha vertical `border-l-2 border-surface-line`, texto e data em todas as entradas.
- `sortedActivity()` ordena por `at` descendente.
- `labelOf()` para rótulos de tipo de atividade.
- `format()` com `Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' })`.
- Campo "Adicionar nota" com input + botão.

### P1 — Validação de formulários
- `ProjectFormComponent` e `TaskFormComponent` com `touched` signal.
- Botões "Guardar"/"Criar" desabilitados quando nome/título vazio ou com menos de 2 caracteres.
- Mensagens de erro abaixo dos campos.
- `DataStore.addProject` e `addTask` ignoram entradas com nome/título vazio.
- Projetos sem nome mostram "Projeto sem nome" em `italic text-ink-400`.

### P1 — Calendário do dashboard
- `date.utils.ts` reescrito com `toISODate`, `todayISO`, `parseISODate`, `weekDaysMondayFirst`.
- Eliminado `toISOString().slice(0, 10)` e `new Date('YYYY-MM-DD')` em toda a app.
- Rótulos fixos `['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']`.
- Setas avançam/recuam 7 dias.

### P2 — /tarefas
- Filtros em dois grupos rotulados (Categoria / Urgência) com separador visual.
- Checkbox "Mostrar concluídas" (por defeito ocultas).
- Task rows com checkbox, título, meta sem "·" solto, badges e `chevron-right`.
- Concluídas ordenadas para o fim dentro de cada grupo.
- Estado vazio quando filtro não devolve nada.

### P2 — /projetos
- Anel de progresso com `size=52`, `stroke-width=3.5`, texto `text-[11px]` (ou `text-[10px]` se 100%).
- Pluralização: "1 de 1 tarefa", "0 de 3 tarefas".
- Cartão clicável com `flex h-full flex-col`, descrição `line-clamp-2 min-h-[40px]`, badges no rodapé `mt-auto`.

### P2 — Detalhes de tarefa e projeto
- Cabeçalho com link de volta, badges de urgência/categoria, estado com classe literal, data.
- Botão "Concluir" → "Reabrir" quando `status === 'done'`.
- Botão "Apagar" como botão perigo.
- Grelha `grid-cols-12` com coluna esquerda (descrição + timeline) e direita (detalhes).
- Toggle "Pode adiar" com a marcação exata do prompt.
- Projeto: cartão "Próximo passo" com label uppercase.

### P2 — /importar
- Layout `grid grid-cols-1 xl:grid-cols-2`.
- Texto "Descobre" → "Descarrega".
- Botão "Copiar prompt para IA" com feedback "Copiado!" durante 2s.

### P2 — Sidebar e Modo foco
- Sidebar fixa ao scroll com `lg:sticky`.
- Modo foco: com tarefa urgente → título + botão "Começar" (`bg-strong`); sem urgente → ícone `sparkles` + "Nada urgente. Respira fundo." + botão "Ver pendentes".

### P3 — /calendario
- Vista mensal, semana a começar à segunda.
- Cabeçalho com setas, mês/ano, botão "Hoje".
- Grelha 7 colunas, células `min-h-[96px]` com dias de outro mês a `opacity-40`.
- Até 2 chips de tarefa por dia, mais `+N`.
- Lista de tarefas do dia selecionado.

### P3 — /definicoes
- 3 cartões: Perfil (input nome), Aparência (toggle Claro/Escuro), Dados (Exportar, Restaurar, Apagar tudo).

### Confirm dialog
- Criado `shared/ui/confirm-dialog.component.ts` com 4 tipos: `danger`, `warning`, `info`, `success`.
- Criado `core/confirm.service.ts` com método `confirm(config): Promise<boolean>`.
- Substituídos todos os `confirm()` nativos por `ConfirmService` em `DataStore`, `SettingsPage` e `ConsoleApi`.

### Pesquisa global
- Criado `core/search.service.ts` com `query` signal.
- `TopbarComponent` integrado com `SearchService`: input com `pl-11`, ícone a `left-4`, botão de limpar.
- `TasksPage.filtered()` e `ProjectsPage.filtered()` filtram por título, descrição, tags e nome do projeto.
- Enter na pesquisa navega para `/tarefas?q=...`.

### Verificação
- `ng build` sem erros.
- `grep -R "dark:" src/app` → sem resultados.
- `grep -R "bg-white" src/app` → apenas exceções permitidas (toggle, sidebar ativo, hover).
- `grep -RE "(bg|text|border)-\[#" src/app` → sem resultados.
- `grep -R "style=" src/app` → sem resultados.
- `grep -R "styles:" src/app` → sem resultados.
- `grep -R "toISOString().slice" src/app` → sem resultados.
