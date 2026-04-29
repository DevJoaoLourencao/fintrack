# fintrack

Aplicativo de controle financeiro pessoal. Registre gastos, acompanhe investimentos, gerencie bens e veículos — tudo em um único painel.

## Funcionalidades

- **Dashboard** — resumo mensal de gastos, patrimônio consolidado (investimentos + veículos + bens), gráficos de tendência e distribuição por categoria
- **Lançamentos** — transações mensais com categorias, cartões, parcelamentos e assinaturas recorrentes
- **Investimentos** — carteira de ativos (Ações, FIIs, Cripto, Internacional, Renda Fixa) com cotação USD em tempo real, snapshots históricos e gráfico de evolução do patrimônio
- **Meus Bens** — cadastro de bens pessoais (imóvel, veículo, outros) com valor de compra e valor atual estimado
- **Motos & Vendas** — inventário de veículos, controle de vendas parceladas e valores a receber
- **Configurações** — categorias e cartões customizáveis

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Estilo | Tailwind CSS + Radix UI |
| Estado global | Zustand |
| Server state | TanStack Query v5 |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| Backend / Auth | Supabase (Postgres + Auth + RLS) |
| Roteamento | React Router v7 |
| Deploy | Netlify (CI/CD via GitHub) |

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) — ou rode em modo mock sem banco

## Instalação

```bash
git clone https://github.com/seu-usuario/fintrack.git
cd fintrack
npm install
```

## Configuração

```bash
cp .env.example .env
```

Edite `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# true = login e dados mock (sem Supabase)
VITE_MOCK_AUTH=false
VITE_MOCK_DATA=false
```

> Chaves disponíveis em **Supabase → Project Settings → API**.

### Modo mock (sem banco)

Defina `VITE_MOCK_AUTH=true` e `VITE_MOCK_DATA=true`. Dados ficam no `localStorage` — útil para rodar a UI sem configurar Supabase.

## Banco de dados

Aplique as migrations no seu projeto Supabase:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

As migrations ficam em `supabase/migrations/` e incluem criação de tabelas e políticas RLS.

## Desenvolvimento

```bash
npm run dev      # http://localhost:5173
npm run build    # build de produção
npm run preview  # preview do build
npm run lint     # ESLint
```

## Estrutura

```
src/
├── components/
│   ├── features/    # Componentes de domínio (dashboard, investments, assets, vehicles…)
│   └── ui/          # Componentes genéricos (Button, Layout, Toast…)
├── domain/          # Tipos TypeScript de domínio
├── hooks/           # TanStack Query hooks por domínio
├── pages/           # Páginas da aplicação
├── services/        # Acesso ao Supabase + mock storage
├── stores/          # Estado global (auth, tema, filtros)
└── lib/             # Utilitários (dateUtils, queryClient, supabase)
```

## Deploy

Push em `main` dispara build automático no Netlify. O `netlify.toml` configura build e redirects para SPA routing.

As variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) devem ser configuradas no painel do Netlify em **Site settings → Environment variables**.
