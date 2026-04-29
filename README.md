# fintrack

Aplicação web de controle financeiro pessoal.

## Stack

- React + TypeScript + Vite
- Tailwind CSS (dark mode via `class` strategy)
- Radix UI (Dialog, Select, Toast, Switch, NavigationMenu...)
- React Router v6
- Zustand (auth + tema)
- TanStack Query (server state)
- Supabase (auth, PostgreSQL, Storage, Edge Functions)
- Recharts (gráficos)
- Deploy: Netlify via GitHub CI/CD

## Setup local

```bash
# 1. Clone e instale dependências
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores do Supabase

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex: `https://abc.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Chave anon pública do Supabase |

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento (http://localhost:5173)
npm run build    # Build de produção
npm run preview  # Preview do build local
npm run lint     # Lint
```

## Deploy

Deployado automaticamente no Netlify a cada push em `main`. O `netlify.toml` configura build e redirects para SPA routing.

## Arquitetura

```
src/
├── domain/          # Tipos e interfaces TypeScript puras
├── services/        # Toda comunicação com Supabase
├── hooks/           # Custom hooks por feature
├── stores/          # Zustand stores (auth + tema)
├── pages/           # Componentes de página
├── components/
│   ├── ui/          # Atoms reutilizáveis (Radix wrappers)
│   └── features/    # Componentes por feature de negócio
└── lib/             # Configs: supabase.ts, queryClient.ts
```
