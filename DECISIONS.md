# DECISÕES — UI Retificação (Fase 0)

## 14. Tokens de cor unificados
- `brand` é o único conjunto de cor do tema; `primary` passou a ser alias de `brand` no `tailwind.config.js`.
- `--primary` e `--primary-dark` removidos do CSS base; `--primary-fg` é calculado por luminância em `ColorSchemeService`.
- `brand.100` e `brand.50` passaram a ser derivados com alpha (`rgb(var(--c-brand) / 0.14)` e `0.07`) para funcionar em claro e escuro.
- `amber`, `rose`, `emerald` removidos do config; usar apenas `success`, `danger`, `warn` com tokens semânticos.
- `ColorSchemeService` é o único serviço que aplica cores: define `--c-brand*`, `--primary-fg` (por luminância), `--foco-logo`, favicon e `theme-color`.
- `ThemeService` ficou só com claro/escuro (`data-theme`).

## 15. Sistema único de ícones
- Standard: `lucide-angular` via wrapper `<app-icon>` (`shared/ui/icon.component.ts`).
- Todos os `<foco-icon>` e `<lucide-icon>` foram substituídos por `<app-icon>`.
- `FOCO_ICONS` e `foco-icon.component.ts` apagados.
- Mapeamento fixo: Nova tarefa=`plus`, Novo projeto=`folder-plus`, Guardar=`save`, Cancelar=`x`, Concluir=`check`, Reabrir=`rotate-ccw`, Adiar=`alarm-clock-plus`, Apagar=`trash-2`, Editar=`pencil`, Exportar=`download`, Importar=`upload`, Copiar=`copy`, Limpar=`eraser`, Entrar=`log-in`, Sair=`log-out`, Começar=`play`, Pausar=`pause`, Parar=`square`, Notificações=`bell`, Tema=`sun`/`moon`.
- Falha de ícone não registado: `console.warn` em dev.

## 16. Componente `<app-button>`
- Criado `shared/ui/button.component.ts` com variants `primary|secondary|ghost|danger|dark` e sizes `md|sm`.
- Responsivo: `iconOnlyBelow` controla quando o botão fica só ícone.
- Estados: `hover`, `active:scale-[.98]`, `focus-visible:ring-2 ring-brand/40 ring-offset-2 ring-offset-surface-card`, `disabled:opacity-50`.
- `loading` troca ícone por `loader-circle` com `animate-spin`.

## 17. Seleccionador de tema `<app-theme-toggle>`
- Criado `shared/ui/theme-toggle.component.ts`.
- Usado na topbar, Definições e Login.
- Dois botões `role="radio"` com ícone `sun`/`moon` + texto `Claro`/`Escuro`.
- Inactivo: `text-ink-500 hover:text-ink`; activo: `bg-surface-card text-ink shadow-sm ring-1 ring-surface-line`.

## 18. NotificationService corrigido
- Bug do `seed().concat(read())` corrigido: agora lê primeiro e só faz seed se storage estiver vazio.
- IDs estáveis (`seed-welcome`).
- Textos falsos removidos; começa com 1 notificação de boas-vindas.
- Limite de 50 itens persistidos.

## 19. Ficheiros alterados na Fase 0
- `tailwind.config.js`
- `src/app/core/color-scheme.service.ts`
- `src/app/core/theme.service.ts`
- `src/app/core/notification.service.ts`
- `src/app/core/icons.ts`
- `src/app/shared/ui/icon.component.ts` (novo)
- `src/app/shared/ui/button.component.ts` (novo)
- `src/app/shared/ui/theme-toggle.component.ts` (novo)
- `src/app/shared/brand/foco-icon.component.ts` (apagado)
- `src/app/layout/topbar.component.ts`
- `src/app/layout/topbar.component.html`
- `src/app/layout/sidebar.component.ts`
- `src/app/layout/sidebar.component.html`
- `src/app/shared/ui/card.component.html`
- `src/app/shared/ui/task-row.component.ts`
- `src/app/shared/ui/task-row.component.html`
- `src/app/shared/ui/badge-category.component.html`
- `src/app/shared/ui/focus-widget.component.ts`
- `src/app/shared/ui/focus-widget.component.html`
- `src/app/shared/ui/empty-state.component.ts`
- `src/app/shared/ui/search-dropdown.component.ts`
- `src/app/shared/ui/confirm-dialog.component.ts`
- `src/app/pages/dashboard/dashboard.page.ts`
- `src/app/pages/dashboard/dashboard.page.html`
- `src/app/pages/project-detail/project-detail.page.ts`
- `src/app/pages/project-detail/project-detail.page.html`
- `src/app/pages/task-detail/task-detail.page.ts`
- `src/app/pages/task-detail/task-detail.page.html`
- `src/app/pages/tasks/tasks.page.ts`
- `src/app/pages/tasks/tasks.page.html`
- `src/app/pages/notifications/notifications.page.ts`
- `src/app/pages/notifications/notifications.page.html`
- `src/app/pages/settings/settings.page.ts`
- `src/app/pages/login/login.page.ts`
- `src/app/pages/login/login.page.html`
- `src/app/app.ts`

## 20. Fonte
- Tipo de letra alterado para **Poppins** (Google Fonts).
- Pesos carregados: 400, 500, 600, 700, 800.
- `tailwind.config.js` actualizado para `fontFamily.sans = ['Poppins', 'Inter', 'system-ui', 'sans-serif']`.
- `src/index.html` actualizado com o link do Google Fonts para Poppins.
- Referências a Plus Jakarta Sans removidas.

