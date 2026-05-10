# MveloAI

A premium AI content generation SaaS dashboard. Generate SEO-optimised blog posts, get step-by-step code explanations, and build reusable prompt libraries, all powered by Replit's built-in AI.

Features:
Blog Generator:	Creates a full SEO-friendly blog post with TL;DR, subheadings, keyword integration, and a call-to-action
Code Explainer:	breaks down any code snippet with step-by-step walkthroughs, beginner analogies, and improvement tips
Prompt Library:	Generates 5 production-ready, reusable prompt cards structured with the CLEAR framework
Every generation returns a live Optimisation Score SEO score (0–100), readability grade, tone match, word count, and keywords used.

Quick Start
Prerequisites
Node.js 24+
pnpm 9+
A Replit environment (database and AI credentials are auto-provisioned)
Install
pnpm install

Push the database schema
pnpm --filter @workspace/db run push

Run in development
Open two terminals (or use Replit workflows):

# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev
# Terminal 2 — Frontend
pnpm --filter @workspace/content-ai run dev

The dashboard is available at http://localhost:80/.

Environment Variables
Variable	Description	Source
DATABASE_URL	PostgreSQL connection string	Auto-provisioned by Replit
AI_INTEGRATIONS_OPENAI_BASE_URL	Replit AI proxy base URL	Auto-provisioned by Replit
AI_INTEGRATIONS_OPENAI_API_KEY	Replit AI proxy key	Auto-provisioned by Replit
SESSION_SECRET	Express session secret	Set in Replit Secrets
No user-supplied API keys are needed.

Stack
Frontend — React 19, Vite, Tailwind CSS v4, shadcn/ui, Framer Motion, Wouter
Backend — Express 5, Node.js 24, TypeScript 5.9
Database — PostgreSQL + Drizzle ORM
AI — Replit AI Integrations (OpenAI-compatible proxy)
Validation — Zod v4, drizzle-zod
API contract — OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas)
Build — esbuild (CJS bundle for the server)
Monorepo — pnpm workspaces
Project Structure
.
├── artifacts/
│   ├── api-server/          # Express API server
│   │   └── src/routes/
│   │       └── content.ts   # AI generation endpoints
│   └── content-ai/          # React + Vite frontend
│       └── src/
│           ├── pages/Dashboard.tsx
│           └── index.css    # Design tokens & theme
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml     # API contract (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── db/
│   │   └── src/schema/
│   │       └── generations.ts
│   ├── integrations-openai-ai-server/   # Server-side AI client
│   └── integrations-openai-ai-react/    # React AI hooks
└── scripts/                 # Shared utility scripts

Useful Commands
# Full typecheck across all packages
pnpm run typecheck
# Regenerate API hooks and Zod schemas from OpenAPI.yaml
pnpm --filter @workspace/api-spec run codegen
# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push
# Build everything
pnpm run build

Documentation link and Presentation:
https://canva.link/5q4m7qa6nipv2no
https://1drv.ms/w/c/3ca1c9c5eb42d44d/IQCJtM-XjpfiTrMfGmP_37L9AS4Wx0p37D6Y4Dd9b4j8vRU?e=qYltd7

License
MIT
