# YouDemy – Implementation Progress

Last updated: 2026-11-19

## Project Plan

1. **Foundation** – Monorepo layout, Maven/Java 21 backend, Vite/React/TypeScript frontend, PostgreSQL + Flyway, Docker Compose, shared API contract.
2. **Authentication** – Registration, login, JWT access tokens, BCrypt, Spring Security, protected routes, `/api/auth/me`.
3. **Playlist import** – URL parser, YouTube Data API v3 client (metadata, paginated playlist items, batched durations), persistence, duplicate/shared-playlist reuse, manual resync.
4. **Progress** – Idempotent complete/uncomplete, per-user progress aggregation, ownership checks.
5. **Notes** – Upsert notes, optimistic version check (stale-write protection), Tiptap editor with debounced autosave.
6. **Frontend** – Dashboard, library, import dialog, two-panel learning page with IFrame player, filters, search, recent/completed/settings pages, dark mode.
7. **Testing** – JUnit 5 + Mockito + H2 integration tests, Testcontainers tests (auto-skip without Docker), Vitest + RTL frontend tests.
8. **Deployment/docs** – Dockerfiles, Compose, `.env.example`, README, final verification.

## Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| 1 – Foundation | Complete | Monorepo, Java 21/Spring Boot 3.3 backend, React 18/TypeScript/Vite frontend, PostgreSQL 16 default with a no-install H2 local profile, Flyway, shared `ApiResponse<T>` contract. |
| 2 – Authentication | Complete | Register/login, BCrypt, JJWT HS384 tokens, stateless Spring Security, `/api/auth/me`, protected frontend routes. |
| 3 – Playlist Import | Complete | URL parser, YouTube Data API client with pagination/batched durations, shared metadata, per-playlist import lock, duplicate handling, manual resync. |
| 4 – Progress Tracking | Complete | Idempotent completion endpoints, per-user aggregation, dashboard stats, resume point, ownership checks on all operations. |
| 5 – Notes Management | Complete | Private versioned notes, 409 stale-write rejection, Tiptap editor, debounced autosave with request sequencing. |
| 6 – Main Frontend | Complete | Dashboard, library, import dialog, two-panel learning page, YouTube IFrame player, search/filters/sorting, recent/completed/settings, dark mode, route-level lazy loading. |
| 7 – Dashboard / UX | Complete | Continue-learning cards, stats, recent activity, skeleton/empty/error states, toast feedback, responsive layouts. |
| 8 – Testing | Complete | 17 backend tests (1 Docker-dependent skip), 17 frontend tests, TypeScript check and production build pass. |
| 9 – Docker / Docs | Complete with caveats | Multi-stage Dockerfiles, Nginx SPA config, Compose, `.env.example`, README, and a local H2 run option are in place; container startup was not run because Docker was unavailable. |

## Implemented Features

### Backend
- Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- Playlist endpoints: import, list, summary, remove from library, set last-watched, resync, paged videos, progress summary.
- Video endpoints: idempotent complete/uncomplete and private versioned note read/write.
- User endpoints: dashboard statistics/activity, recently watched, completed videos.
- YouTube URL parsing for playlist URLs, watch URLs with `list=`, youtu.be links, and bare playlist IDs.
- YouTube Data API v3 client with playlist metadata, paginated items, private/deleted video filtering, and batched duration lookup.
- Shared playlist/video metadata with per-user library, progress, notes, and access records; UUID keys and Flyway-managed constraints/indexes.
- Per-playlist `ReentrantLock` around a `TransactionTemplate` to prevent concurrent duplicate imports.
- Ownership checks before returning playlist, video, progress, or note data; cross-user resources return 404.
- Consistent success/error response envelopes, Bean Validation, structured field errors, and actuator health endpoint.
- Local file-backed H2 profile (`spring-boot.run.profiles=local`) for development without PostgreSQL or Docker; data persists in `backend/data/youdemy.mv.db` across restarts. PostgreSQL remains the production/default database.
- Automatic import of the repository-root `.env` for local backend runs, with existing environment variables taking precedence.

### Frontend
- Login/register pages, JWT persistence, auth guard, and automatic unauthorized handling.
- Responsive dashboard and library with search, status filters, sorting, skeletons, empty states, and error states.
- Playlist import dialog and manual sync action.
- Two-panel learning page with searchable video list, embedded YouTube IFrame player, completion controls, resume deep links, and navigation.
- Tiptap rich-text notes with debounced autosave, stale-version conflict handling, and sequenced saves.
- Recently watched, completed videos, and settings pages; light/dark theme; toast feedback.
- TanStack Query data layer, Axios client, React Router, Lucide icons, and shadcn-style UI primitives.
- Route-level lazy loading and manual vendor chunks (React, router, query, UI, editor) to keep the initial bundle small.

### Infrastructure and documentation
- Multi-stage `backend/Dockerfile` and `frontend/Dockerfile`, plus `.dockerignore` files.
- `frontend/nginx.conf` with SPA history fallback, static asset caching, and `/api` reverse proxy to the backend service.
- Vite dev server `/api` proxy to `http://localhost:8080`, so no frontend `.env` is needed for local development.
- `docker-compose.yml` for PostgreSQL, optional Redis (`cache` profile), backend, and frontend.
- Maven wrapper (`backend/mvnw`, `backend/mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties`) so no global Maven install is required.
- `.env.example` with placeholders only; no real secrets committed.
- `README.md` with setup, configuration, API reference, architecture notes, testing, and troubleshooting.

## Remaining Work / Known Limitations

- `docker compose --env-file .env.example config --quiet` validates successfully. The Compose stack has not been built or started here; the Docker daemon was unavailable (`docker API at npipe:////./pipe/dockerDesktopLinuxEngine`). Run `docker compose up --build` and check frontend/backend health when Docker is available.
- `PostgresMigrationTest` is intentionally skipped when Docker is unavailable; PostgreSQL migration verification in a real container remains outstanding.
- Live YouTube playlist import has not been verified because no real `YOUTUBE_API_KEY` was provided. Production uses `YouTubeRestClient`; only tests mock the API.
- No remaining build warnings. Route-level lazy loading and manual vendor chunks resolved the earlier Vite chunk-size warning; the largest emitted chunk is the editor vendor chunk (~334 kB raw, ~107 kB gzipped), loaded only on the learning page.
- Redis is provided as an optional Compose profile only; the application does not require it for normal operation.
- Git is not initialized in `D:\YouDemy`; all work is currently uncommitted.

## Known Bugs

- None known in implemented application code.
- Startup was previously blocked by a `PlaylistSummaryProjection` constructor/type mismatch; fixed by using `long` for the HQL `count()` projection and casting to `int` in `PlaylistSummaryDto`.
- Backend integration tests previously failed due to response-envelope unwrapping and shared state; fixed by unwrapping `data` in helpers and applying per-test `@Transactional` isolation.

## Test Results

### Backend

Command (from `backend/`): `.\mvnw.cmd test`

- **17 tests run, 0 failures, 0 errors, 1 skipped**
- `AuthIntegrationTest`: 5 passed
- `EnvFileImportTest`: 1 passed
- `PlaylistIntegrationTest`: 7 passed
- `YouTubeUrlParserTest`: 3 passed
- `PostgresMigrationTest`: skipped (requires Docker)
- Local H2 profile startup verified separately: `/actuator/health` returned `UP` and `POST /api/auth/register` returned `201` with no PostgreSQL running.
- Persistence verified across a backend restart: the same account login returned `200` and duplicate registration returned `409`; test data was cleaned up afterward.

### Frontend

Commands (from `frontend/`): `npm test`, `npm run typecheck`, `npm run build`

- **17 tests passed** across 4 test files.
- Coverage includes auth flows, playlist rendering/filtering/import, learning-page resume/navigation/completion, notes autosave/failure handling, and loading/error states.
- TypeScript type check and production build succeed with no Vite warnings; pages and vendor libraries are split into smaller chunks.

## Verification Checklist

- [x] Backend test suite passes.
- [x] Maven wrapper verified with `.\mvnw.cmd -v` (Apache Maven 3.9.9).
- [x] Backend starts with the local H2 profile and accepts registration without PostgreSQL.
- [x] Local H2 data persists across backend restarts.
- [x] Vite `/api` proxy verified end-to-end: registration through `http://localhost:5173/api/auth/register` returned `201`.
- [x] Root `.env` import verified with `EnvFileImportTest` using a fake key; real key was never logged.
- [x] Frontend test suite passes.
- [x] Frontend type check passes.
- [x] Frontend production build succeeds with no warnings.
- [x] Environment variable names checked against Compose and documentation.
- [x] Docker Compose config validated with `.env.example`.
- [ ] Docker Compose build/startup verified (blocked: no Docker daemon).
- [ ] Live YouTube import verified with a real API key.
