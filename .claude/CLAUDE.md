# painel-inovacao
> Plataforma interna onde colaboradores da Efizi submetem ideias de sistemas, e o admin acompanha, aprova ou recusa cada chamado com rastreamento de status de desenvolvimento.

## Arquitetura
Next.js + Supabase direto

## Stack
- Frontend: Next.js (App Router) + TypeScript strict
- Banco: Supabase (Postgres)
- Auth: Supabase Auth com Google Workspace OAuth (restrito a @efizi.com.br)
- Storage: Supabase Storage (protótipos HTML e documentação)
- Realtime: Supabase Realtime (colaborador recebe update de status sem recarregar)

## Auth
- Provider: Google OAuth via Supabase
- Domínio permitido: somente @efizi.com.br
- Dados puxados do Google no login: nome, foto, e-mail, setor (department)
- Restrição de domínio configurada no Supabase Auth (allowlist) + validação no middleware
- Dois perfis de acesso:
  - `collaborator` → vê e cria apenas os próprios chamados
  - `admin` → acessa painel completo, aprova/recusa, adiciona observações

## Áreas da aplicação

### /app (colaborador)
- Submeter ideia: título, descrição, área/setor (puxado do Google), documentação (upload), protótipo HTML (upload, opcional)
- Listar chamados próprios com status atual
- Ver timeline de status de cada chamado

### /admin (somente admin)
- Dashboard: total de chamados por área, SLA (tempo médio em cada status), chamados parados
- Fila de chamados pendentes: aprovar, recusar ou adicionar observação
- Visão de projetos aprovados com status de desenvolvimento

## Status dos chamados
```
pendente → aprovado | recusado
aprovado → em_desenvolvimento → concluido
em_desenvolvimento substatus: banco_de_dados | integracao | subindo_servidor | em_teste
```

## Padrões
- Chamadas ao Supabase: sempre via Server Components ou Server Actions
- Nunca exponha a service_role key no cliente — apenas a anon key
- RLS ativo: colaborador só lê/escreve os próprios chamados; admin bypassa via service_role no servidor
- Variáveis de ambiente: NEXT_PUBLIC_ só para o que o cliente realmente precisa
- Middleware Next.js valida sessão e redireciona rotas protegidas

## Comandos
- dev: `npm run dev`
- build: `npm run build`
- lint: `npm run lint`

## Decisões de arquitetura
- Kanban removido do escopo inicial — pode ser adicionado depois
- Setor do colaborador é puxado do Google Workspace no login e salvo no perfil do Supabase
- Realtime usado para notificar colaborador quando o status do chamado muda

## Agentes disponíveis

Use "use o agente [nome]" ou descreva o que precisa — o agente correto será invocado.

| Agente | Quando usar |
|--------|------------|
| `architect` | Planejar projeto novo do zero — blueprint completo antes de codar |
| `designer` | Criar UI, avaliar design, aplicar Efizi DS ou criar DS novo |
| `reviewer` | Review de código antes de commitar ou fazer PR |
| `debugger` | Investigar bugs e comportamentos inesperados |
| `refactor` | Organizar projeto herdado, HTML gigante, JSX monolítico |
| `inovacao` | Descobrir o que está faltando no produto — funcionalidades priorizadas |
| `security` | Auditar segurança, credenciais, APIs externas, rate limiting |
| `documenter` | Atualizar README, JSDoc, docstrings e decisões de arquitetura |
| `test-writer` | Criar testes para GitHub Actions CI/CD |

## Padrões visuais obrigatórios

- Design system: Efizi (C:\Users\KayqueSantos\Desktop\dev\efizi-design-system-main)
- Nunca criar UI genérica — sempre usar componentes do design system
- Dark mode como padrão
- Layout com dois lados em páginas de auth — nunca form centralizado sozinho
- Cores sempre via variáveis CSS — nunca hardcode
- Ícones sempre via Lucide React
- Referências visuais: Raycast, Retool, Supabase, Jeton
