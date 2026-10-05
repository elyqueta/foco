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
