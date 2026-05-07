# ChurchLive

Software moderno de projeção para igrejas — controle de músicas, liturgia, Bíblia e projeção ao vivo com comunicação em tempo real via WebSocket.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/church-projection run dev` — run the frontend (port 20976)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (dark mode, Poppins font)
- API: Express 5 + WebSocket (ws)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Real-time: WebSocket at `/ws`

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — DB schema (collections, songs, liturgies, projection state)
- `artifacts/api-server/src/routes/` — Route handlers (songs, collections, liturgy, bible, projection, stats, audio)
- `artifacts/api-server/src/lib/websocket.ts` — WebSocket server + broadcast
- `artifacts/church-projection/src/` — React frontend
- `config/musicas/` — Drop MP3 files here for automatic indexing

## Architecture decisions

- WebSocket path `/ws` is registered in `artifact.toml` alongside `/api` so the reverse proxy forwards it correctly
- Projection state is stored in PostgreSQL and broadcasted via WebSocket on every control command
- Bible data is in-memory (Portuguese books list + sample popular verses); search is done in-process
- Song lyrics are split into verses by double newline; verse labels detected by regex
- The `lib/api-zod/src/index.ts` exports only `./generated/api` (not types) to avoid duplicate export errors from Orval
- Settings stored in localStorage (theme, church name, logo, projection/audio prefs) — shared across all windows same-origin
- Themes applied via CSS class on `<html>`: `dark` (default), `dark theme-worship-purple`, or `theme-light-modern`

## Product

- **Home** — painel principal com relógio ao vivo, estatísticas e navegação
- **Operador** — controle total da projeção com atalhos de teclado, modo de reprodução, botões para abrir janelas externas
- **Projeção** — tela fullscreen 16:9 para o projetor; suporte a múltiplos monitores via `window.open`; tecla F = fullscreen
- **Palco** — monitor de retorno com letra atual/próxima, relógio, cronômetro do culto, próximo item da liturgia
- **Liturgia** — criar e gerenciar ordem do culto com itens arrastáveis e duração estimada
- **Coletâneas** — biblioteca de coletâneas de músicas com busca
- **Músicas** — lista completa com filtros, favoritos e busca
- **Bíblia** — navegador por livros/capítulos e busca de versículos com projeção instantânea
- **Configurações** — nome/logo da igreja, seletor de 3 temas, configurações de projeção e áudio, pasta de MP3

## Keyboard shortcuts (Operator screen)

| Key | Action |
|-----|--------|
| → / ↓ | Next verse |
| ← / ↑ | Previous verse |
| Space / Esc | Clear projection |
| F | Focus search |
| P | Open projection window |
| S | Open stage monitor |
| ? | Show shortcuts help |

## Themes

Three selectable themes in Settings:
1. **Dark Blue Premium** — navy-black + neon blue (default)
2. **Worship Purple** — deep purple-black + purple accent
3. **Light Modern** — clean light mode with blue accent

## Music Playback Modes (Operator)

Double-click a song (or click the MonitorPlay icon) to launch the mode selector:
1. **Somente Letras** — lyrics only, no audio
2. **Letras + Playback** — lyrics with audio player controls
3. **Letras + Áudio Cantado** — lyrics with full MP3 playback

## MP3 / Audio Indexing

Place `.mp3` files in `config/musicas/` (server-side). In Settings → Pasta de Músicas, click "Escanear e Vincular" to auto-link files to songs by matching filename to song title.

## User preferences

- Stack obrigatória: React + Vite, Node.js/Express, PostgreSQL, WebSocket
- Dark mode permanently (deep navy-black + neon blue)
- Fonte Poppins
- Interface em Português Brasileiro
- Sistema deve funcionar offline (dados em cache local)

## Gotchas

- After adding new routes, restart the API Server workflow (it needs to rebuild)
- The `/ws` path must be in `artifact.toml` paths array for WebSocket to work through the proxy
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change, then fix `lib/api-zod/src/index.ts` to only export `./generated/api`
- Bible verses are sample data only — a full Bible database can be added later
- When opening projection/stage windows, they inherit localStorage theme automatically

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
