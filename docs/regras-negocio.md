# Regras de Negócio — Foco

> Documento de referência oficial para o comportamento da aplicação.
> Sempre que houver conflito entre este documento e o código, este documento prevalece e o código deve ser corrigido.

---

## 1. Objetivo do Produto

O **Foco** é um dashboard pessoal de tarefas e projetos que mostra, ao abrir, exatamente o que o utilizador tem de fazer hoje. Funciona 100% localmente no browser, sem backend, com persistência em `localStorage`.

---

## 2. Modelo de Dados

### 2.1 Enums

| Campo | Valores possíveis |
|---|---|
| `Category` | `professional`, `personal`, `household` + categorias personalizadas |
| `Urgency` | `critical`, `high`, `medium`, `low` |
| `Task.status` | `todo`, `in_progress`, `done`, `postponed`, `expired` |
| `Project.status` | `active`, `paused`, `done` |
| `ActivityEntry.type` | `created`, `status_changed`, `note`, `postponed`, `edited`, `next_step_changed`, `expired` |

### 2.2 Entidades Principais

#### Task (Tarefa)
- `id`: UUID gerado pela app (`crypto.randomUUID()`)
- `projectId`: UUID do projeto ou `null` (tarefa solta)
- `title`: título da tarefa
- `description`: descrição detalhada
- `category`: categoria da tarefa
- `urgency`: nível de urgência
- `status`: estado atual da tarefa
- `canPostpone`: booleano, indica se a tarefa pode ser adiada
- `dueDate`: data de prazo no formato `YYYY-MM-DD` ou `null`
- `nextStep`: próximo passo concreto (1 frase)
- `estimateMinutes`: estimativa em minutos ou `null`
- `tags`: array de strings
- `activity`: array de `ActivityEntry` (histórico)
- `createdAt`, `updatedAt`, `completedAt`: timestamps ISO 8601

#### Project (Projeto)
- Campos semelhantes à Task, mas com `color` (hex) e sem `completedAt`
- `color`: cor hex da paleta de projetos

#### AppData (Estado Global)
- `schemaVersion`: sempre `1`
- `projects`: array de `Project`
- `tasks`: array de `Task`
- `settings`: `{ theme: 'light' | 'dark'; userName: string }`
- `categories`: array de strings com todas as categorias disponíveis

---

## 3. Categorias

### 3.1 Categorias Padrão
As três categorias iniciais são:
- `professional` — Profissional
- `personal` — Pessoal
- `household` — Doméstica

### 3.2 Categorias Personalizadas
- O utilizador pode adicionar novas categorias através da página `/categorias`
- Categorias personalizadas podem ser removidas
- Categorias padrão (`professional`, `personal`, `household`) **não podem ser removidas**
- Ao remover uma categoria, todas as tarefas e projetos que a usam são reassinalados para `professional`
- Nome da categoria: mínimo 2 caracteres, não pode duplicar

### 3.3 Uso em Filtros
- As listas de tarefas e projetos mostram filtros dinâmicos baseados nas categorias existentes
- Filtros aparecem como chips: "Todas" + cada categoria disponível

---

## 4. Urgência

### 4.1 Níveis
| Nível | Valor | Descrição |
|---|---|---|
| Crítica | `critical` | Máxima prioridade, aparece sempre em "Hoje" |
| Alta | `high` | Alta prioridade |
| Média | `medium` | Prioridade normal (padrão) |
| Baixa | `low` | Baixa prioridade |

### 4.2 Ordem de Prioridade
A ordem usada para ordenação é: `critical=0, high=1, medium=2, low=3`

### 4.3 Flag `canPostpone`
- `true`: tarefa/projeto pode ser adiado
- `false`: tarefa/projeto não pode ser adiado
- Quando `false`, o botão "Adiar" não aparece e mostra aviso "Esta tarefa não pode ser adiada"

---

## 5. Estados de Tarefa

### 5.1 Estados Possíveis
| Estado | Valor | Significado |
|---|---|---|
| Por fazer | `todo` | Tarefa criada, ainda não iniciada |
| Em curso | `in_progress` | Tarefa em execução |
| Concluída | `done` | Tarefa terminada |
| Adiada | `postponed` | Tarefa adiada para outra data |
| Expirada | `expired` | Tarefa com prazo vencido |

### 5.2 Transições de Estado
- `todo` → `in_progress` (iniciar)
- `in_progress` → `todo` (reabrir)
- `todo/in_progress/postponed` → `done` (concluir)
- `done` → `todo` (reabrir)
- `todo/in_progress` → `postponed` (adiar)
- `todo/in_progress` → `expired` (auto, por prazo vencido)

---

## 6. Regras de Criação

### 6.1 Criação de Tarefa
- **Título**: obrigatório, mínimo 2 caracteres
- **Data de prazo (dueDate)**: não pode ser no passado
  - Se o utilizador tentar criar uma tarefa com `dueDate` anterior a hoje, a criação é bloqueada
- **Categoria padrão**: `professional`
- **Urgência padrão**: `medium`
- **Estado padrão**: `todo`
- **Pode adiar padrão**: `true`
- **Estimativa padrão**: `null`
- **Tags padrão**: `[]`
- **Projeto padrão**: `null` (tarefa solta)

### 6.2 Criação de Projeto
- **Nome**: obrigatório, mínimo 2 caracteres
- **Categoria padrão**: `professional`
- **Urgência padrão**: `medium`
- **Estado padrão**: `active`
- **Pode adiar padrão**: `true`
- **Cor padrão**: `#6C5CE7`
- **Próximo passo padrão**: `''`

### 6.3 Criação via Console (`window.foco`)
- Se `projectName` for fornecido e o projeto não existir (comparação case-insensitive), é criado automaticamente
- Categorias e urgências inválidas são substituídas pelos defaults (`professional`, `medium`)

---

## 7. Regras de Data e Prazo

### 7.1 Bloqueio de Datas Passadas
- Não é permitido criar tarefas com `dueDate` no passado
- A validação compara apenas a parte da data (`YYYY-MM-DD`), ignorando a hora

### 7.2 Tarefas Expiradas (Expired)
- **Trigger**: no arranque da aplicação, a função `expireOverdueTasks()` é executada
- **Condição**: tarefa com `status` em `todo` ou `in_progress` e `dueDate` < hoje
- **Exceções**: tarefas `done`, `postponed` ou já `expired` não são processadas
- **Ação**: `status` é alterado para `expired`, `updatedAt` atualizado, adicionada entrada de atividade do tipo `expired` com mensagem "Tarefa expirada por prazo vencido"
- Tarefas expiradas são **excluídas** de: Hoje, Pendentes, Urgentes, Próximos Passos
- Tarefas expiradas **contam** nas estatísticas por categoria

### 7.3 Formato de Datas
- `dueDate` (data de prazo): `YYYY-MM-DD`
- `createdAt`, `updatedAt`, `completedAt`, `activity.at`: ISO 8601 completo (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Datas são exibidas em `pt-PT` via `Intl.DateTimeFormat`
- Nunca são usadas bibliotecas de datas externas

---

## 8. Listas e Computados

### 8.1 Tarefas de Hoje (`todayTasks`)
Inclui tarefas que:
- `status` ≠ `done` E `status` ≠ `expired`
- E (`urgency` === `critical` OU `dueDate` === hoje OU `dueDate` < hoje)

### 8.2 Tarefas Pendentes (`pendingTasks`)
Inclui tarefas com `status` em: `todo`, `in_progress`, `postponed`

### 8.3 Tarefas Urgentes (`urgentTasks`)
Inclui tarefas que:
- `status` ≠ `done` E `status` ≠ `expired`
- `urgency` em: `critical`, `high`
- Ordenação: por urgência (críticas primeiro), depois por `dueDate` (mais antiga primeiro)

### 8.4 Próximos Passos (`nextSteps`)
Inclui itens (tarefas ou projetos) que:
- Têm `nextStep` não vazio
- Projetos: `status` ≠ `done`
- Tarefas: `status` ≠ `done` E `status` ≠ `expired`
- Máximo 6 itens
- Ordenação: por urgência (críticas primeiro)

### 8.5 Estatísticas por Categoria (`statsByCategory`)
- Para cada categoria existente: `{ total, done, percent }`
- `total`: número de tarefas nessa categoria
- `done`: número de tarefas concluídas nessa categoria
- `percent`: percentagem de conclusão (0-100)

### 8.6 Concluídas esta Semana (`completedThisWeek`)
- Tarefas com `status` === `done` E `completedAt` >= há 7 dias

---

## 9. Regras de Edição

### 9.1 Edição de Tarefa
- Qualquer campo pode ser editado diretamente na página de detalhe
- Alterações geram entrada de atividade do tipo `status_changed` (se status mudou) ou `next_step_changed` (se próximo passo mudou)
- `updatedAt` é atualizado em cada edição

### 9.2 Edição de Projeto
- Campos editáveis: nome, descrição, categoria, urgência, estado, prazo, próximo passo, cor
- Alterações no `nextStep` geram entrada de atividade

---

## 10. Regras de Adiamento (Postpone)

- Apenas tarefas com `canPostpone === true` podem ser adiadas
- Ao adiar:
  - `dueDate` é atualizado para a nova data/hora
  - `status` é alterado para `postponed`
  - É criada entrada de atividade do tipo `postponed` com mensagem "Adiada para {data formatada}"
- O modal de adiamento aceita data e hora (`datetime-local`)

---

## 11. Regras de Conclusão

- Ao concluir tarefa:
  - `status` → `done`
  - `completedAt` → timestamp atual
  - Entrada de atividade do tipo `status_changed`
- Ao reabrir tarefa:
  - `status` → `todo`
  - `completedAt` → `null`
  - Entrada de atividade do tipo `status_changed`
- Se todas as tarefas de um projeto estiverem concluídas, é sugerido (toast) marcar o projeto como concluído

---

## 12. Regras de Eliminação

### 12.1 Eliminar Tarefa
- Requer confirmação via diálogo Promise-based
- Eliminação permanente, sem recuperação

### 12.2 Eliminar Projeto
- Requer confirmação via diálogo Promise-based
- Elimina o projeto E todas as suas tarefas
- Ação irreversível

---

## 13. Regras de Importação/Exportação

### 13.1 Exportação
- Exporta todo o estado da aplicação em JSON
- Formato igual ao `AppData`
- Download como ficheiro `foco-backup.json`

### 13.2 Importação
- **Aditiva**: nunca apaga dados existentes, apenas adiciona
- Gera novos IDs para todos os items importados
- Validação manual de campos:
  - `category` deve ser um valor válido do enum
  - `urgency` deve ser um valor válido do enum
  - `title` (tarefa) e `name` (projeto) são obrigatórios
- Erros são reportados por campo, sem interromper a importação de items válidos
- Se houver erros, a importação é abortada

### 13.3 Formato Aceite
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

---

## 14. API da Consola (`window.foco`)

Disponível no browser após carregamento da app:

| Método | Descrição |
|---|---|
| `foco.addTask({...})` | Cria tarefa. Se `projectName` não existir, cria projeto automaticamente |
| `foco.addProject({...})` | Cria projeto |
| `foco.import(json)` | Importa JSON (mesmo formato da secção 13) |
| `foco.list()` | `console.table` das tarefas não concluídas |
| `foco.today()` | `console.table` das tarefas de hoje |
| `foco.export()` | Devolve JSON completo do estado atual |
| `foco.clear()` | Apaga todos os dados (com confirmação) |

### Defaults da API
- `category`: `professional`
- `urgency`: `medium`
- `status`: `todo`
- `canPostpone`: `true`

---

## 15. Persistência

### 15.1 Repository Pattern
- `DataRepository` é uma classe abstrata com métodos `load()` e `save(data: AppData)`
- `LocalStorageRepository` é a implementação atual
- Chave do `localStorage`: `foco:data:v1`
- No futuro, pode ser substituída por `ApiRepository` sem alterar a store

### 15.2 Auto-save
- Um `effect()` Angular grava no repositório a cada alteração de estado
- Se o `localStorage` falhar (ex: quota excedida), o erro é silenciado

### 15.3 Migração
- `schemaVersion` é verificado no carregamento
- Se versão for diferente de `1`, os dados são resetados para o estado vazio
- Se os dados estiverem corrompidos (JSON inválido), são resetados

---

## 16. Inicialização

### 16.1 Dados de Exemplo (Seed)
- Carregados apenas quando `projects.length === 0` E `tasks.length === 0`
- Contém 2 projetos e 4 tarefas de exemplo (uma por categoria + uma crítica)
- Inclui dados em todas as categorias para demonstrar o design preenchido

### 16.2 Dados Padrão
- Se `categories` estiver vazio ou ausente, é reposto para `['professional', 'personal', 'household']`

### 16.3 Expiração no Arranque
- `expireOverdueTasks()` é executada no construtor da `DataStore`
- Marca automaticamente tarefas vencidas como `expired`

---

## 17. Regras de Interface

### 17.1 Toggle de Estado (Tarefas)
- Checkbox redondo nas listas alterna entre `done` e `todo`
- Se a tarefa já estiver `done`, volta a `todo`; senão, vai para `done`

### 17.2 Filtros de Tarefas
- **Categoria**: chips dinâmicos baseados nas categorias existentes
- **Urgência**: chips fixos (Todas, Crítica, Alta, Média, Baixa)
- **Mostrar concluídas**: toggle para incluir/excluir tarefas `done`
- **Mostrar expiradas**: toggle para incluir/excluir tarefas `expired`

### 17.3 Filtros de Projetos
- **Categoria**: chips dinâmicos baseados nas categorias existentes

### 17.4 Pesquisa
- Filtra por título, descrição, nome do projeto e tags
- Case-insensitive
- Navega para o primeiro resultado encontrado

### 17.5 Atalhos de Teclado
- `N`: abre modal de nova tarefa
- `/`: foca a pesquisa
- `Esc`: fecha modal

---

## 18. Regras de Navegação

### 18.1 Rotas
| Caminho | Página | Descrição |
|---|---|---|
| `/` | Dashboard | Página inicial com resumo |
| `/projetos` | Projetos | Lista de projetos com filtros |
| `/projetos/:id` | Detalhe do Projeto | Página de vida do projeto |
| `/tarefas` | Tarefas | Lista de tarefas com filtros |
| `/tarefas/:id` | Detalhe da Tarefa | Página de vida da tarefa |
| `/calendario` | Calendário | Vista semanal |
| `/calendario/:date` | Dia do Calendário | Tarefas de um dia específico |
| `/importar` | Importar | Importar/exportar JSON |
| `/categorias` | Categorias | Gerir categorias |
| `/definicoes` | Definições | Configurações da app |

### 18.2 Navegação por Pesquisa
- Ao pesquisar, se houver exatamente um resultado, navega automaticamente para ele

---

## 19. Regras de Design e Acessibilidade

### 19.1 Idioma
- Interface: Português (Angola/Portugal)
- Código, nomes de variáveis e ficheiros: Inglês

### 19.2 Estilo
- Apenas classes utilitárias Tailwind (sem CSS custom)
- Fonte: Plus Jakarta Sans
- Paleta de cores fixa (ver `tailwind.config.js`)
- Modo escuro: toggle que altera `data-theme="dark"` no `<html>`
- Modo escuro deve cobrir 100% dos componentes

### 19.3 Acessibilidade
- Botões com `aria-label`
- Inputs com `<label>`
- Contraste AA mínimo
- Estados de foco visíveis (`focus-visible:ring-2`)

### 19.4 Responsivo
- Sem scroll horizontal em nenhum breakpoint
- Testado em: 375px, 768px, 1280px, 1440px

---

## 20. Regras Técnicas

### 20.1 Stack
- Angular 19+ (standalone components)
- TypeScript strict
- Tailwind CSS 3.4 (não v4)
- Sem bibliotecas de UI (Material, PrimeNG, Bootstrap)
- Sem backend (apenas `localStorage`)

### 20.2 Padrões de Código
- Componentes standalone
- Signals e computed signals para estado reativo
- Novo control flow (`@if`, `@for`, `@switch`) — proibido `*ngIf`/`*ngFor`
- Zero `any`
- Lazy loading nas rotas (`loadComponent`)

### 20.3 Validação
- `ng build` deve passar sem erros
- `ng build --configuration production` deve passar limpo

---

## 21. Histórico de Atividade

Toda a atividade é registada em `ActivityEntry`:

| Tipo | Quando é criado | Mensagem padrão |
|---|---|---|
| `created` | Criação de tarefa/projeto | "Tarefa criada" / "Projeto criado" |
| `status_changed` | Alteração de estado | "Estado alterado para {status}" |
| `note` | Adição de nota | Texto da nota |
| `postponed` | Adiamento de tarefa | "Adiada para {data}" |
| `edited` | Edição genérica | - |
| `next_step_changed` | Alteração de próximo passo | "Próximo passo atualizado" |
| `expired` | Tarefa expirada automaticamente | "Tarefa expirada por prazo vencido" |

- Cada entrada tem `id`, `at` (timestamp ISO), `type` e `message`
- Ordenada por `at` decrescente (mais recente primeiro)

---

## 22. Regras de Negócio Específicas

### 22.1 Tarefa Crítica
- Tarefas com `urgency === 'critical'` aparecem sempre em "Tarefas de Hoje", mesmo sem prazo definido

### 22.2 Tarefa Atrasada
- Tarefa com `dueDate` no passado e não concluída é considerada atrasada
- Na UI, o prazo é exibido em `text-danger` com ícone `alert-circle`

### 22.3 Projeto Concluído
- Quando todas as tarefas de um projeto estão `done`, é sugerido marcar o projeto como `done`

### 22.4 Confirmações
- Apagar tarefa: diálogo de confirmação
- Apagar projeto: diálogo de confirmação (com aviso de que também apaga tarefas)
- Limpar todos os dados: diálogo de confirmação
- Remover categoria: diálogo de confirmação
- APIs de consola: `clear()` requer confirmação

---

## 23. Seed Data (Dados de Exemplo)

Carregados apenas na primeira vez (store vazio):

**Projetos:**
1. Loja Nerd — Categoria: personal, Urgência: high
2. destino-mussulo — Categoria: professional, Urgência: critical

**Tarefas:**
1. Integrar API real no destino-mussulo — professional, critical
2. Definir catálogo inicial — personal, high, in_progress
3. Compras do supermercado — household, medium
4. Ligar para a mãe — personal, low, sem prazo

---

*Última atualização: 2026-10-04*
