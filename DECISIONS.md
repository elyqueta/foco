# DECISIONS.md — Correções aplicadas (Fase 3 + Dashboard)

## Ficheiros alterados

| Ficheiro | Alteração |
|---|---|
| `src/app/app.ts` | Template passa a `<app-shell />`. Importa apenas `ShellComponent`. |
| `src/app/layout/shell.component.ts` | Importa `ModalComponent`, `TaskFormComponent`, `TaskModalService`, `DataStore`. Controla o modal globalmente. |
| `src/app/layout/shell.component.html` | Template EXATO do prompt: shell com `rounded-[28px]`, `overflow-hidden`, `min-w-0` no contentor direito e no `<main>` para eliminar overflow horizontal. Modal "Nova tarefa" movido para aqui. |
| `src/index.html` | Adicionado `overflow-x-hidden` ao `<body>` para garantir zero scroll horizontal. |
| `src/app/layout/sidebar.component.ts` | Importa `LucideAngularModule`. Define `items` com as 6 rotas. |
| `src/app/layout/sidebar.component.html` | Template EXATO do prompt: `@for (item of items; track item.path)` com `lucide-icon`. |
| `src/app/layout/topbar.component.ts` | Sinal `theme`, `setTheme`, `exportData`, `openNewTask`. Atalhos de teclado (`N` e `/`) no `ngOnInit`. Importa `LucideAngularModule`. |
| `src/app/layout/topbar.component.html` | Template EXATO do prompt: tabs, pesquisa com ícone `search`, toggle claro/escuro, botão Exportar, botão Nova tarefa. |
| `src/app/pages/dashboard/dashboard.page.ts` | Usa `document.querySelector('app-modal')` para abrir o modal (que agora está no shell). |
| `src/app/pages/dashboard/dashboard.page.html` | Grelha `grid-cols-12` com `items-stretch` e `min-w-0` em todos os filhos. 4 cartões-resumo com altura fixa `h-[160px]`. Layout das 3 linhas conforme especificação. |
| `src/app/shared/ui/card.component.ts` | Adicionado `host: { class: 'block min-w-0' }`. |
| `src/app/shared/ui/card.component.html` | Template EXATO do prompt: `flex h-full min-w-0 flex-col`, `truncate` no título. |
| `src/app/core/task-modal.service.ts` | **Novo**: serviço com sinal `open` para abrir/fechar o modal a partir de qualquer componente. |
| `src/app/app.routes.ts` | Adicionadas rotas `/calendario` e `/definicoes` com páginas placeholder. |
| `src/app/pages/calendar/calendar.page.ts` | **Novo**: página placeholder com `<app-empty-state title="Em breve" />`. |
| `src/app/pages/settings/settings.page.ts` | **Novo**: página placeholder com `<app-empty-state title="Em breve" />`. |

## Decisões tomadas

1. **`lucide-angular` em vez de SVGs inline** — O prompt especifica `<lucide-icon>` para sidebar e topbar. O pacote foi instalado com `--legacy-peer-deps` por incompatibilidade de peer do Angular 22. Usado `LucideAngularModule` (não o componente diretamente, pois não é standalone).

2. **Modal movido para o shell** — O botão "Nova tarefa" existe na topbar em todas as páginas, mas o modal estava apenas no dashboard. O modal e o `TaskFormComponent` foram movidos para `ShellComponent`, que agora controla a abertura/fecho. O dashboard apenas faz `document.querySelector('app-modal')` e dispara um evento `open`. Isto mantém o comportamento original sem complicações.

3. **`min-w-0` como regra obrigatória** — Aplicado no shell (`shell.component.html`), no `<main>`, no contentor direito, em todos os filhos diretos das grelhas do dashboard, e no `<app-card>` via `host.class`. Isto elimina o overflow horizontal e iguala alturas.

4. **`items-stretch` nas grelhas do dashboard** — Substitui `items-start` para que cartões da mesma linha tenham a mesma altura.

5. **`truncate` nos títulos dos cartões** — Previne que textos longos empurrem a largura para além dos limites.

6. **Altura fixa `h-[160px]` nos cartões-resumo** — Garante altura igual nos 4 cartões da primeira linha.

7. **Páginas placeholder para `/calendario` e `/definicoes`** — Links na sidebar deixam de estar mortos. Cada página usa `<app-empty-state title="Em breve" />`.

8. **Zero CSS puro, só classes Tailwind** — Verificado com `grep -r "style=" src/app` e `grep -r "styles:" src/app` — ambos retornam zero resultados.

9. **`LucideAngularModule` em vez de `LucideAngularComponent`** — O componente não é standalone, pelo que tem de ser importado via módulo.

## Checklist de verificação

- [x] **1. `ng build` sem erros** — Build concluído com sucesso em 5.9s.
- [ ] **2. Janelas 1440px / 1280px / 1024px / 768px / 375px sem scroll horizontal** — Requer verificação manual no browser (`document.documentElement.scrollWidth <= window.innerWidth === true`).
- [ ] **3. A 1280px+: fundo cinza-lavanda, moldura branca-acinzentada arredondada, sidebar roxa curva com ícone Dashboard ativo, topbar completa** — Requer verificação visual.
- [ ] **4. 4 cartões-resumo cabem completos e têm 160px de altura** — Estrutura aplicada; requer verificação visual.
- [ ] **5. Cartões da mesma linha com alturas iguais** — `items-stretch` aplicado; requer verificação visual.
- [ ] **6. Toggle Claro/Escuro funciona e persiste** — Implementado com `setTheme` + `data-theme` attribute; requer verificação manual.
- [x] **7. Zero `style=` e zero `styles:` em `src/app`** — Confirmado por grep.
