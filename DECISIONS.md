# DECISÕES — Ecrã de Login e Autenticação

## 1. Estrutura de autenticação
- **Repository pattern** com `AuthRepository` abstrata e duas implementações: `MockAuthRepository` (ativa por omissão) e `ApiAuthRepository` (desligada até a API Laravel estar pronta).
- A troca entre mock e API faz-se apenas mudando `useMockAuth` em `environment*.ts`.

## 2. Sessão
- Sessão guardada em `localStorage` com a chave `foco:auth:v1`.
- `AuthService` usa signals: `_session`, `user`, `isAuthenticated`, `token`.
- `isAuthenticated` considera a expiração (`expiresAt`).

## 3. Proteção de rotas
- `authGuard` protege o shell (todas as rotas autenticadas).
- `guestGuard` impede acesso ao login quando já existe sessão.
- `/login` fica FORA do shell, sem sidebar/topbar.

## 4. Interceptor
- Adiciona `Accept: application/json` e `Authorization: Bearer <token>` a todos os pedidos a `environment.apiBaseUrl`.
- Em `401` (exceto `/auth/login`), faz `clearLocal()` e redireciona para `/login`.

## 5. Login page
- Mock com delay de 600 ms e credenciais: `admin@todo.ao` / `12345678`.
- Formulário reativo com validação e mensagens em português.
- Dica de demonstração visível apenas quando `useMockAuth` é true.
- Tema alternativo no canto superior direito (sol/lua).
- Design com painel gradiente esquerdo (exceção hex `#2B2780` e `#1B1470`) e formulário direito.

## 6. Topbar
- Menu do utilizador adicionado depois do botão "Nova tarefa".
- Dropdown com iniciais, nome, email, link para definições e "Terminar sessão".
- Fecha ao clicar fora ou com `Esc`.

## 7. Dashboard
- Saudação passa a usar `auth.user()?.name ?? settings.userName`.
- Card "Modo foco" com temporizador regressivo em tempo real (`MM:SS`).
- Ações no card: Ver tarefa, Pausar/Continuar, Parar.

## 8. Modo foco
- `FocusService` gere sessão com estado pausado/retomado.
- Tick atualizado a cada segundo via intervalo.
- Sessão persistida em `localStorage` (`foco:focus:v1`).
- Widget flutuante global arrastável (`FocusWidgetComponent`).
- Posição do widget guardada em `localStorage` (`foco:focus-widget-pos:v1`).
- Widget aparece só depois de iniciar uma tarefa.
- Botões do widget sincronizados com o card do dashboard.

## 9. Notificações
- Página `/notificacoes` com lista mockada.
- `NotificationService` com seed e persistência em `localStorage` (`foco:notifications:v1`).
- Badge de não lidas no menu do utilizador.

## 10. Exportação
- Diálogo de escolha de formato antes de exportar.
- Suporte a JSON (backup) e PDF (relatório formatado).
- PDF gerado com jsPDF + autotable, com tabelas estilizadas para projetos e tarefas.
- Cor do PDF segue o esquema de cores escolhido pelo utilizador.

## 11. Personalização de cores
- Esquemas disponíveis: roxo, azul, vermelho e cinza.
- Preferência guardada em `localStorage` através do `DataStore`.
- Cores aplicadas via variáveis CSS dinâmicas (`--c-brand`, `--c-brand-600`, etc.).
- `ColorSchemeService` gere a lógica de aplicação e leitura do esquema.

## 12. Proxy
- `proxy.conf.json` encaminha `/api` para `http://localhost:8000` (container Laravel).
- Configurado em `angular.json` para `ng serve`.

## 13. Verificações realizadas
- `ng build` sem erros.
- Ícone de pesquisa ajustado (left-3) para não sobrepor o placeholder.
- Novos ícones adicionados: `Eye`, `EyeOff`, `LogOut`, `Target`, `Sun`, `Moon`, `BellRing` (mantidos `Check` e `Sparkles` existentes).
- Contagem regressiva do foco atualizada a cada segundo.
- Widget flutuante arrastável com botões sincronizados com o card do dashboard.
- Exportação JSON e PDF funcionais.
- Personalização de cores sem destruir funcionalidades existentes.

## 14. Retificação de UI — Fase 0
- `brand` é a fonte única da cor de destaque; `primary` é um alias dos mesmos tokens dinâmicos. `--primary-fg` mantém-se apenas como token semântico para texto sobre fundos sólidos e é escolhido pela maior razão de contraste entre branco e ink.
- `brand-50` e `brand-100` são derivados por alpha de `--c-brand`; `ColorSchemeService` define `--c-brand-fg` como a cor de marca no tema claro e `brand-400` no escuro. O mesmo serviço aplica os tokens de marca, `--primary-fg`, logótipo, favicon e `theme-color`; `ThemeService` limita-se à preferência claro/escuro e ao atributo `data-theme`.
- Tokens semânticos `success`, `warn` e `danger` (incluindo `-soft`) têm valores próprios para claro e escuro. Os componentes não usam aliases de cor amber/rose/emerald do Tailwind.
- `<app-icon>` com `lucide-angular` é a única interface de ícones; os nomes suportados são centralizados em `core/icons.ts` e nomes não registados em desenvolvimento geram `console.warn`. Os desenhos da marca e gráficos SVG funcionais (como o anel de progresso) não são ícones de ação e permanecem próprios.
- `<app-button>` é o botão comum para ações, com ícone, nome acessível/título, variantes, tamanhos, carregamento e modo só-ícone responsivo. Ações de cabeçalho/página mostram só o ícone abaixo de `sm`; ações de rodapé e do login mantêm ícone e texto. O botão do menu do utilizador mantém o primeiro nome visível em ecrãs maiores, com rótulo acessível próprio e `aria-expanded`.
- Botões nativos restantes são controlos de seleção com semântica específica: opções de tema (`radiogroup`), filtros, dias do calendário e seleção de cor/formato; checkboxes também permanecem nativos/estilizados.
- `src/styles.css` contém apenas as três diretivas Tailwind. O template gerado `src/app/app.html`, que não era usado pela aplicação e continha CSS embutido, foi removido. A fonte Plus Jakarta Sans é carregada no documento base.
- A otimização de fontes externas fica sem inline no build de produção: mantém-se o carregamento da Google Font no browser sem tornar `ng build` dependente de acesso à Internet.
- Migrados nesta fase: tokens globais e paleta semântica; wrappers de ícones e botões; topbar, sidebar, dashboard, calendário, listas e detalhes; notificações, importação, definições, login, formulários, modais e widget de foco.
- Validação desta fase: `ng build` conclui sem erros nem avisos do compilador Angular. Permanecem os avisos existentes do bundle inicial (913,20 kB face ao limite de 500 kB) e dependências CommonJS usadas por `canvg`/`jspdf`; não foram alteradas porque a otimização dessas dependências não faz parte desta fase.

## 15. Ajustes responsivos e temporizador
- O atalho "Ver pendentes" usa `RouterLink` importado explicitamente no dashboard standalone para navegar para `/tarefas`.
- O botão "Começar temporizador" na página de detalhe inicia o foco da tarefa, actualiza o seu estado para "Em curso" e apresenta o widget global.
- Em larguras abaixo de `lg`, o widget de foco usa uma barra compacta arrastável com tempo, pausa/retoma e paragem; a posição é limitada ao ecrã, mantida em `localStorage` e reajustada ao redimensionar. Sessões persistidas voltam a mostrar o widget.
- Em ecrãs abaixo de 360px, os cartões de progresso por categoria passam a uma lista horizontalmente legível; os anéis reduzem de tamanho, limitam percentagens ao intervalo 0–100 e usam verde a partir de 60%.
- O shell, topbar e modais reduzem espaçamentos para acomodar larguras a partir de 320px. A navegação inferior mantém cinco destinos frequentes e agrupa Importar/Definições num menu "Mais", preservando alvos de toque de 44px sem barra de scroll.
- Em Definições, os esquemas de cor usam grelha 2×2 em ecrãs estreitos (4 colunas a partir de 480px) e os botões de gestão de dados mantêm ícone e texto visíveis, com tamanho compacto.

## 16. Cor de tema no modo escuro
- No modo escuro, `ColorSchemeService` mistura a cor do esquema escolhido em bases quase pretas para os tokens da página, app, cartões, bordas e botão escuro. Os níveis de mistura aumentam gradualmente entre superfícies para conservar a hierarquia visual sem clarear excessivamente os fundos.
- Ao regressar ao modo claro, os overrides inline das superfícies escuras são removidos e os tokens claros existentes voltam a ser usados; os valores Tailwind de modo escuro servem como fallback para o esquema roxo antes da aplicação dos valores guardados.

## 17. Integração com a API v1 (Foco API)

### Ambientes
- `src/environments/environment.ts` (produção): `production: true`, `useApi: true`, `apiBaseUrl: '/api/v1'` (relativo, mesma origem em produção).
- `src/environments/environment.development.ts` (desenvolvimento): `production: false`, `useApi: true`, `apiBaseUrl: 'http://localhost:8000/api/v1'`.
- `angular.json` passa a usar `fileReplacements` na configuração `development` do build, substituindo `environment.ts` por `environment.development.ts` (verificado nos bundles: produz `/api/v1` e `http://localhost:8000/api/v1`).
- A flag `useMockAuth` foi substituída por `useApi`: quando true, `App` usa `ApiAuthRepository` + `LocalTasksRepository`; caso contrário, mock + storage local completo.

### Camada de API
- `core/api.service.ts` (`ApiService`) centraliza os endpoints existentes em `/api/v1`: auth (login, register, logout, logout-all, me, password, profile), settings (GET/PATCH), categories (list/create/delete), projects (list com filtros, get, create, update, delete, notes) e health.
- `core/api.models.ts` define os DTOs da API; `ApiError` normaliza erros (`status`, `code`) e expõe `isNoChanges` para o contrato `422 NO_CHANGES`.
- Todos os pedidos passam pelo `authInterceptor` (Bearer + `Accept: application/json`); respostas validadas contra a API real em desenvolvimento.

### Endpoints aplicados vs. o que fica local
- **Remotos (API):** categorias, projetos (CRUD + notas), definições (userName/tema), autenticação completa.
- **Locais (localStorage, `foco:tasks:v1`):** tarefas, notas de tarefas, atividade de tarefas, esquema de cor, modo foco, notificações — a API v1 ainda não tem estes endpoints. Nada foi desabilitado.
- `LocalTasksRepository` persiste apenas `tasks` + `settings` em modo API e miga uma única vez os dados de `foco:data:v1`; em modo local o `LocalStorageRepository` mantém o comportamento anterior.
- O progresso dos projetos é calculado a partir das tarefas locais; quando não há tarefas locais, usa-se o `progress` devolvido pela API como fallback.

### Carregamento, erros e skeletons
- O carregamento remoto (`DataStore.init()`) arranca só depois de a sessão ser validada (`AuthService.validateSession()` → `GET /auth/me`), evitando pedidos antes da autenticação; `reload()` é chamado após login/registo.
- `DataStore` expõe `loading`, `loadError`, `retryLoad()` e `flash` (toast). Skeletons (`app-skeleton`, `animate-pulse` com tokens existentes) em dashboard, projetos, tarefas, detalhe de projeto, categorias e calendários; estados de erro com ação "Tentar novamente".
- Erros de escrita (criar/atualizar/remover) e `422 NO_CHANGES` ("Nenhuma alteração detetada.") são comunicados por toast (`ToastComponent` no shell).

### Ajustes de conformidade com a API real
- `GET /settings` devolve `userName` (não `name`) — o modelo aceita ambos.
- As 3 categorias provisionadas no registo vêm com `isDefault: false` (são removíveis): a proteção passa a depender exclusivamente do `isDefault` do servidor em modo API; em modo local mantém-se a lista das três padrão.
- Categorias personalizadas (ex.: "Estudos") são suportadas em filtros, badges (`app-badge-category` com rótulo/fallback), dashboard e importação.

### Correções de lacunas pré-existentes expostas pela integração
- `ProjectFormComponent` não carregava o `@Input() project`: o modal de edição abria vazio e o submit ficava desabilitado. Passa a inicializar o formulário em `ngOnInit`.
- A página de detalhe de projeto não tinha botões para `openEditProject`/`deleteProject` (código existente sem UI): adicionados "Editar" e "Apagar" no cabeçalho.
- O detalhe do projeto passa a derivar o projeto da store (computed), refletindo notas e edições sem recarregar a página.

### Verificações
- `ng build` (development e production) sem erros.
- E2E headless contra a API real em `localhost:8000`: login pelo formulário, dashboard, projetos (listar/criar/editar com e sem alterações), notas, categorias (criar/remover), definições (nome+tema sincronizados), tarefas locais com persistência, skeletons confirmados com API atrasada, zero erros de consola.
- Não relacionado: `ng test` já falhava antes destas alterações (incompatibilidade `module`/`moduleResolution` em `tsconfig`) e o `app.spec.ts` espera um título que não existe; não foi alterado.

## 18. Correções da revisão de código e ecrã de cadastro

### Isolamento de dados locais por conta (CRITICAL)
- `LocalTasksRepository` passou a ter escopo de sessão: chave `foco:tasks:v1:<userId>`; `DataStore.setSessionScope(userId)` é chamada no login, no registo, na validação da sessão (caminho de reload da página) e a `null` no logout/401 (`AuthService.clearLocal`). Sem sessão, a store usa dados vazios.
- A migração a partir de `foco:data:v1` é única e só corrida no primeiro login com conta associada (a flag `foco:tasks:v1:migrated` só é escrita quando há scope), evitando que o bootstrap sem sessão a consuma antes do primeiro utilizador.

### Sessão mais robusta
- `ApiAuthRepository.me()` passa a falhar fechado: qualquer resposta >= 400 do `/auth/me` invalida a sessão.
- `AuthService.validateSession()` só limpa a sessão em `401`; erros de rede/5xx mantêm a sessão e a app continua a renderizar (sem skeleton infinito).
- `ensureValidated()` memoiza a validação e é usada pelo `authGuard`/`guestGuard` (aguardam a validação antes de decidir) e pelo arranque da app, com uma única chamada a `/auth/me` por arranque. Os guards capturam `inject(Router)` antes do `await` (sem `inject` fora do contexto de injeção).
- `app.ts` usa `ensureValidated()` antes de `store.init()`.

### Regressões e bugs corrigidos
- `removeCategory` voltou a remapear também os `projects` para `professional` (a reescrita tinha perdido esse remapeamento no modo local).
- Importação passa a mapear o `id` original do ficheiro JSON para o id final do projeto (API e local), restaurando a ligação tarefa→projeto que estava desaparecida.
- `fetchProjectDetail` ignora respostas obsoletas (guarda pelo id atual da rota), evitando skeleton escondido cedo/dados antigos em navegação rápida.
- `loadFromApi` passa a ter de-duplicação em voo (`inFlight`), evitando lotes duplicados e escritas fora de ordem; o bloco de refresh foi extraído para `refreshCategoriesAndProjects()`.

### Migração sem perda silenciosa
- Nas Definições (modo API), quando existe `foco:data:v1` aparece um cartão de aviso com ação "Exportar backup antigo", para que os projetos/categorias locais anteriores não fiquem inacessíveis sem aviso.

### Nome do perfil
- Alterar "O teu nome" nas Definições passa a sincronizar com `PATCH /auth/profile` (com debounce), atualizando também o utilizador da sessão — saudação e topbar refletem a mudança.

### Ecrã de cadastro
- Nova rota `/cadastro` (`RegisterPage`) com o design system do login (painel gradiente, passos, campos com validação PT, mostrar/ocultar palavra-passe, confirmação com validação de coincidência, link "Já tens conta? Entrar").
- A página de login ganhou o link "Cadastra-te" → `/cadastro`.
- O registo entra diretamente na app: `AuthService.register()` grava a sessão, associa o scope das tarefas locais e carrega os dados remotos; o utilizador segue para o dashboard sem login manual.
- `LoginField` e o mapeamento de erros da API passam a cobrir `name` e `passwordConfirmation`, mostrando os erros de validação no campo certo.

### Duplicação e código morto
- Rótulos de atividade extraídos para `core/activity.utils.ts` (`activityLabel`), usados no detalhe de projeto e de tarefa.
- Estatísticas de projeto centralizadas em `DataStore.projectStats()` (tarefas locais com fallback para o `progress` da API), usadas nas páginas de projetos e detalhe.
- Removidos: `ApiService.health()`, `DataStore.mergeTasks()`, `DataStore.categoryLabel()` (todos sem callers).
- O ramo mock/local (`MockAuthRepository`/`LocalStorageRepository`, bloco de demonstração no login) mantém-se como fallback offline explícito, ativável por `useApi: false` nos ambientes; está documentado porque nenhum ambiente o seleciona atualmente.

### Deploy
- Produção continua a usar `apiBaseUrl: '/api/v1'` (same-origin). O deploy precisa de expor `/api/v1` na mesma origem (reverse proxy/rewrite) ou alterar o URL de produção; fica registado como requisito de infraestrutura.

### Verificações adicionais
- Registo automático (sem login manual) verificado por E2E, incluindo migração de dados legacy, isolamento entre duas contas no mesmo dispositivo (chaves separadas, sem visibilidade cruzada), persistência de tarefas por conta e regressão completa de projetos/notas/categorias/definições sem erros de consola.

## 19. Tarefas passam a ser geridas pela API

Com os endpoints de tarefas adicionados à API v1, a gestão de tarefas deixa de ser local:

### Endpoints aplicados
- `GET /v1/tasks` — carregamento inicial com `includeDone=true&includeExpired=true` (a UI continua a filtrar/ordenar no cliente, preservando filtros, pesquisa e toggles existentes).
- `POST /v1/tasks` — criação (módulo do topbar, página de tarefas, detalhe de projeto, console API e importação).
- `GET /v1/tasks/{id}` — detalhe com atividade (página de detalhe carrega via API e deriva o resto da store).
- `PATCH /v1/tasks/{id}` — edição parcial de campos; respeita a máquina de estados do servidor (`INVALID_TRANSITION`, `POSTPONE_REQUIRES_DATE`, `PAST_DUE_DATE`, `NO_CHANGES`); a opção `expired` foi removida do seletor de estado (é definida pelo sistema).
- `POST /v1/tasks/{id}/complete` e `/reopen` — usados pelas transições concluir/reabrir em vez de PATCH.
- `POST /v1/tasks/{id}/postpone` — adiamento com data e hora (`YYYY-MM-DDTHH:mm`, formato já emitido pelo modal).
- `POST /v1/tasks/{id}/notes` — notas de tarefa.
- `DELETE /v1/tasks/{id}` — remoção com confirmação.

### Consequências na arquitetura
- `LocalTasksRepository` deixa de espelhar tarefas: guarda apenas preferências locais. `pendingTasks()`/`clearTasks()` existem só para a migração única de tarefas de armazenamentos antigos (`foco:data:v1` → chave com escopo → upload via `POST /tasks` → limpeza da cache). Tarefas com prazo no passado são recriadas sem prazo; as que falham são reportadas por toast.
- `projectStats` passa a usar o `progress` devolvido pelo servidor em modo API.
- A expiração preguiçosa (`expireOverdueTasks`) passou a correr só em modo local — o servidor expira ao listar.
- O botão "Apagar dados locais" (Definições) limpa apenas a cache local; os dados do servidor não são afetados.
- O cartão de backup legado e o aviso nas Definições foram atualizados para refletir que projetos, categorias e tarefas estão no servidor.

### Verificações
- E2E contra a API real: criar tarefa pelo modal, listar (dados do servidor), detalhe com nota (aparece na timeline), concluir, reabrir, adiar, editar urgência por select e apagar com confirmação — todos os endpoints chamados corretamente, zero erros de consola.
- Migração de 3 tarefas antigas (incluindo uma com prazo no passado e uma concluída) verificada: sobem para a API e a cache local fica vazia.

## 20. Timer de tarefas via API

Com os endpoints de timer adicionados à API v1, o temporizador passou a ser gerido pelo servidor (substituindo o pomodoro local apenas no modo API; o `FocusService` local continua como fallback do modo local):

### Endpoints aplicados
- `POST /v1/tasks/{id}/timer/start` — inicia (`todo`/`postponed` passam a `in_progress`); devolve `{ task, pausedTask? }` e aplica ambas à store, refletindo a pausa automática da tarefa que estava a correr.
- `POST /v1/tasks/{id}/timer/pause` — pausa e acumula segundos; `422 TIMER_NOT_RUNNING` mostra toast.
- `POST /v1/tasks/{id}/timer/resume` — retoma (única forma de uma `postponed` voltar a `in_progress`).
- `GET /v1/timer/active` — chamado no carregamento remoto para recuperar o timer ativo ao abrir a app.

### Estado e UI
- `DataStore.activeTimerTask` devolve apenas a tarefa com timer **a correr** (alinhado com `/timer/active`); `activeTimerSeconds` soma `trackedSeconds` ao tempo decorrido desde `runningSince`, com reavaliação a cada segundo via tick do `FocusService`.
- O widget de foco em modo API mostra a tarefa ativa e o tempo acumulado, com Pausar/Parar (ambos pausam — a API não tem "parar"); a retoma faz-se no detalhe da tarefa.
- O detalhe da tarefa mostra "Começar/Pausar/Retomar temporizador" conforme o estado do timer, um indicador com o tempo acumulado e a atividade do timer na timeline (entradas `timer_started`/`timer_paused`/`timer_resumed`/`timer_stopped`).
- `409 TIMER_ALREADY_RUNNING` mostra toast informativo em vez de erro.

### Verificações
- E2E contra a API real: iniciar pelo detalhe (estado passa a "Em curso" e o widget aparece a contar), pausar e retomar pelo widget, pausa automática ao iniciar outra tarefa, widget a seguir o novo timer, estado reposto após recarregar a página e retoma pelo detalhe; atividade do timer visível na timeline; zero erros de consola.

## 21. Timeline de atividade paginada e timer em tempo real

- **Paginação da timeline:** a lista de atividade no detalhe da tarefa mostra inicialmente as 5 entradas mais recentes, com botão "Ver mais N actividades" que acrescenta 5 de cada vez (some quando não há mais). Evita cartões/páginas demasiado longos em tarefas com muitas entradas. O limite é reiniciado ao navegar entre tarefas.
- **Timer em tempo real:** o temp derivado (`activeTimerSeconds`) dependia do `FocusService.tick`, que devolve sempre o mesmo valor (0) sem sessão local — e nos signals do Angular um computado com valor inalterado corta a propagação, deixando o contador congelado. Passa a depender de `FocusService.tickCount` (contador que muda a cada segundo), pelo que o tempo avança em tempo real tanto no widget como no indicador do detalhe da tarefa.
- Verificado por E2E: o valor sobe um segundo por segundo (00:02 → 00:07) e a paginação percorre 5 → 10 → 13 entradas até esgotar, sem erros de consola.

## 22. Paginação horizontal da timeline e botão do card de foco

- **Paginação horizontal:** a timeline de atividade passou a ser paginada por páginas (5 entradas por página) com controlos horizontais no fim da lista — "Página anterior", números de página e "Página seguinte" — em vez de um botão vertical "Ver mais". Mantém as entradas uma por linha e evita que o card (e o input de nota abaixo) fiquem demasiado longos. A página reinicia ao trocar de tarefa e volta à primeira quando uma nota é adicionada (a nota nova é a entrada mais recente).
- **Card "Modo foco" da dashboard:** em modo API passa a reflecting o timer do servidor — mostra a tarefa com o timer a correr e o tempo em tempo real, e o botão da vista de repouso é **"Retomar"** (em vez de "Começar") quando a tarefa em destaque tem o timer pausado, evitando o `422 TIMER_WRONG_STATE` da API ao tentar iniciar uma tarefa já pausada.

## 23. Contrato paginado da API e preservação de detalhe

- A API passou a devolver **respostas paginadas** em `GET /v1/projects` e `GET /v1/tasks` (`{ items, page, perPage, total, totalPages, counts }`), enquanto a documentação local ainda descreve arrays — a API é a fonte da verdade. `ApiService` passou a ler `items` (tolerante a arrays simples, para compatibilidade) e a percorrer todas as páginas (`perPage=100`) antes de devolver a lista, para não truncar dados de utilizadores com muitos itens.
- `GET /v1/timer/active` passou a devolver `{ task, message }` em vez de `204`/task direta — o serviço extrai `task` e devolve `null` quando não há timer a correr.
- Foi corrigida a perda de atividade quando respostas sem `activity` (lista paginada, ações de timer, estado) substituíam uma tarefa cujo detalhe já tinha sido carregado: `preserveDetail()` nas listas e preservação no `applyTask()`.
- Verificado por E2E: dashboard carrega sem erro (projetos, tarefas, categorias, definições e timer ativo), timeline mantém as entradas após iniciar/pausar/retomar o timer e paginação navega entre páginas sem erros de consola.

## 24. Definições: nome com botão Salvar e alteração de palavra-passe

- **Nome com gravação explícita:** o campo "O teu nome" deixou de sincronizar automaticamente com a API a cada tecla. Passa a ter um botão **Salvar** (desabilitado quando não há alterações ou o nome é inválido), um aviso "Tens alterações por guardar" e feedback por toast. Ao guardar faz `PATCH /auth/profile` (fonte do nome visível na topbar/saudação) e atualiza o nome local; erros da API (ex.: 422) são mostrados no campo sem aplicar o valor. Enquanto o utilizador não escreve, o campo segue o nome carregado do servidor.
- **Alteração de palavra-passe:** novo cartão "Palavra-passe" nas Definições que usa `PATCH /auth/password` (`currentPassword`, `password`, `passwordConfirmation`) — válido no modo API e no mock. Inclui mostrar/ocultar em cada campo, validações (nova ≥ 8, confirmação igual, diferente da atual), erros da API mostrados no cartão (ex.: "A palavra-passe atual está incorreta."), limpeza dos campos e toast de sucesso. A nota informa que as outras sessões do utilizador são terminadas.
- Verificado por E2E: nenhuma chamada à API enquanto se escreve o nome, `PATCH` apenas no Salvar com toast, e ciclo completo da palavra-passe (erro com password incorreta → sucesso com campos limpos), sem erros de consola.

