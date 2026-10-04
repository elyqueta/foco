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

## 8. Proxy
- `proxy.conf.json` encaminha `/api` para `http://localhost:8000` (container Laravel).
- Configurado em `angular.json` para `ng serve`.

## 9. Verificações realizadas
- `ng build` sem erros.
- Ícone de pesquisa ajustado (left-3) para não sobrepor o placeholder.
- Novos ícones adicionados: `Eye`, `EyeOff`, `LogOut`, `Target`, `Sun`, `Moon` (mantidos `Check` e `Sparkles` existentes).
