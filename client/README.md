# MeshHub — Client

React SPA for the MeshHub platform — a web application for uploading, browsing, and interactively viewing 3D models (`.glb` / GLTF format), editing display settings, organizing models into scenes, and embedding models on third-party sites with API-key access.

> **Monorepo context:** This directory contains only the frontend. The backend is a NestJS REST API located in `../server/`. See the root `README.md` for full-stack setup instructions.

---

## Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| UI Framework | React | 19.2.5 |
| Language | TypeScript | 6.0.3 |
| Build Tool | Vite | 8.0.9 |
| Component Library | Mantine | 9.1.0 |
| State Management | Redux Toolkit + RTK Query | 2.11.2 |
| State Persistence | redux-persist | 6.0.0 |
| Routing | React Router DOM | 7.14.2 |
| 3D Rendering | Three.js | 0.184.0 |
| Camera Controls | camera-controls | 3.1.2 |
| Rich Text Editor | Tiptap + @mantine/tiptap | 3.22.4 / 9.1.0 |
| Form Validation | Zod | 4.3.6 |
| Styling | SCSS (sass-embedded) + Mantine CSS | — |
| Linting | ESLint 9 (flat config) + Prettier | 9.39.4 / 3.8.3 |

---

## Requirements

| Tool | Minimum Version |
|---|---|
| Node.js | **≥ 24.11.1** |
| npm | **≥ 11.6.2** |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (default port 8000)
npm run dev
```

---

## Scripts

| Script | Description |
|---|---|
| `dev` | Start Vite dev server with host binding (`0.0.0.0`) |
| `dev:prod` | Start Vite dev server in **production** mode (uses production env) |
| `build` | Type-check then build to `dist/` |
| `preview` | Serve the `dist/` build locally |
| `lint` | Run ESLint across the project |
| `lint:fix` | Run ESLint and auto-fix fixable issues |
| `format` | Run Prettier over `src/` |
| `tscheck` | TypeScript type-check without emitting files |

---

## Environment Variables

Create a `.env` file in the `client/` directory. Variables without the `VITE_` prefix are consumed by Vite's Node.js config layer only and are **not** exposed to browser bundles.

| Variable | Used By | Description |
|---|---|---|
| `PORT` | `vite.config.ts` | Dev server port (default: `8000`) |
| `API_PROXY_URL` | `vite.config.ts` | Base URL of the NestJS REST API (e.g. `https://api.meshhub.local`) |
| `WS_PROXY` | `vite.config.ts` | WebSocket server URL for Socket.IO (e.g. `https://api.meshhub.local`) |
| `VITE_APP_API_URL` | `src/app/api/base.ts` | API base URL injected into the browser bundle for RTK Query (defaults to `/`) |

### Vite Dev Proxy Rules

| Prefix | Target | Notes |
|---|---|---|
| `/api` | `API_PROXY_URL` | Forwards REST API calls; HTTPS, `changeOrigin: true` |
| `/socket.io` | `WS_PROXY` | WebSocket proxy; `ws: true` |
| `/files` | `API_PROXY_URL` | Static file serving (avatars, model files); strips the `/files` prefix |

---

## Architecture

The project follows **Feature-Sliced Design (FSD)** with strict one-directional import rules.

```
src/
├── app/          # App bootstrap, router, Redux store, RTK Query base
├── entities/     # Domain entities: user, model-3d, organization
├── pages/        # Route-level page components
├── shared/       # Cross-cutting utilities, theme, hooks, constants
└── widgets/      # Composite reusable UI blocks
```

→ See [`docs/architecture.md`](docs/architecture.md) for the full breakdown.

---

## Documentation Index

| File | Description |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | FSD layer breakdown, dependency rules, conventions |
| [`docs/routing.md`](docs/routing.md) | Route table, lazy loading, layout nesting |
| [`docs/state-management.md`](docs/state-management.md) | Redux store, RTK Query, persistence |
| [`docs/api.md`](docs/api.md) | All API endpoints, DTOs, cache tags, auth token flow |
| [`docs/theming.md`](docs/theming.md) | Color themes, Mantine override, SCSS mixins |
| [`docs/widgets.md`](docs/widgets.md) | Catalogue of all 28 reusable widget directories |
| [`docs/3d-viewer.md`](docs/3d-viewer.md) | Model3DViewer architecture, class API, lifecycle |
| [`docs/editor.md`](docs/editor.md) | EditorPage internals, components, hooks |
| [`docs/scene-editor.md`](docs/scene-editor.md) | Scene Editor page (panels, viewer integration, mutation flow) |
| [`docs/embed.md`](docs/embed.md) | Embed feature (project configuration page + public viewer trust model) |
| [`docs/organization-dashboard.md`](docs/organization-dashboard.md) | Organization & workspace dashboard (members, API keys, webhooks, subscription) |
| [`docs/notifications.md`](docs/notifications.md) | Notification bell widget + notifications API module |
