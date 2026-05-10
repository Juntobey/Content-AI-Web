# ContentAI

A premium AI content generation SaaS dashboard that generates blog posts, explains code, and creates prompt libraries using Replit's native AI — no API keys required.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/content-ai run dev` — run the frontend (port 24325)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, framer-motion, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Replit AI Integrations (OpenAI-compatible, no user key needed)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/generations.ts` — Generations table schema
- `artifacts/api-server/src/routes/content.ts` — AI generation routes
- `artifacts/content-ai/src/pages/Dashboard.tsx` — Main dashboard page
- `artifacts/content-ai/src/index.css` — Theme and design tokens
- `lib/integrations-openai-ai-server/` — OpenAI server client
- `lib/integrations-openai-ai-react/` — OpenAI React hooks

## Architecture decisions

- Replit AI Integrations proxy used instead of direct OpenAI keys — zero user setup required
- Single-page dashboard with sidebar tool switching (no page routing needed)
- All generations persisted to Postgres for history and stats
- SEO score calculated server-side from keyword coverage + word count + structure
- Codegen-first: all API types flow from `openapi.yaml` → Zod schemas → React Query hooks

## Product

ContentAI generates three types of content:
1. **Blog Generator** — SEO-friendly blog posts with TL;DR, headings, keyword integration
2. **Code Explainer** — Step-by-step code walkthroughs with analogies
3. **Prompt Library** — 5 reusable prompt cards with full structure (CLEAR framework)

Each generation returns: the content, word count, SEO score (0-100), readability, tone match, and keyword usage. All generations are saved to history.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Google Fonts `@import url(...)` must be the VERY FIRST LINE of index.css — before `@import "tailwindcss"`
- API server bundles with esbuild; restart workflow after any backend change
- `pRetry.AbortError` must be imported as named `AbortError` from `p-retry` (not `pRetry.AbortError`)
- Run `pnpm install --no-frozen-lockfile` when adding deps to AI integration libs

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
