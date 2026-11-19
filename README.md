# YouDemy

YouDemy turns YouTube playlists into a focused learning tracker. Import a playlist, watch videos in an embedded player, mark progress, take private rich-text notes, and resume exactly where you left off.

The project is a production-oriented monorepo:

- `backend/` — Java 21 / Spring Boot 3 REST API with JWT auth, PostgreSQL, Flyway, and YouTube Data API integration
- `frontend/` — React 18 / TypeScript SPA with Tailwind CSS, shadcn-style components, TanStack Query, Tiptap, and the YouTube IFrame Player API

> No real credentials are committed. `.env.example` contains placeholders only.

---

## Features

### Learning workflow
- Import playlists from standard YouTube playlist URLs, watch URLs with `list=`, youtu.be links, or a bare playlist ID
- Metadata, paginated video items, private/deleted video filtering, and batched duration lookup via YouTube Data API v3
- Shared playlist metadata is fetched once and reused for every user who imports the same playlist
- Idempotent complete/uncomplete operations with per-user progress and dashboard statistics
- Resume from the last watched video, with deep links via `?video=<id>`
- Manual "Sync with YouTube" to refresh a playlist
- Private, versioned rich-text notes with optimistic stale-write protection and debounced autosave

### UI/UX
- Responsive premium dashboard with light/dark themes
- Two-panel learning page: searchable video list + player + notes
- Playlist library with search, status filters, and sorting
- Recently watched and completed-video views
- Toast feedback, skeleton loading states, empty/error states, and protected routes

### Security & correctness
- BCrypt password hashing, JJWT access tokens, stateless Spring Security
- Every playlist, video, note, and progress operation checks ownership
- Consistent `ApiResponse<T>` envelope and structured error responses
- Flyway-managed schema with UUID primary keys and uniqueness constraints
- Per-playlist import locking to prevent concurrent import races

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, CVA, TanStack Query, Axios, React Router, Lucide, Tiptap, Sonner, Vitest, RTL |
| Backend | Java 21, Spring Boot 3.3, Spring Web, Spring Security, Spring Data JPA/Hibernate, Bean Validation, Flyway, JJWT, Lombok, JUnit 5, Mockito, H2, Testcontainers |
| Data | PostgreSQL 16, optional Redis 7 (Compose profile `cache`) |
| Infra | Docker, Docker Compose, Nginx |

---

## Prerequisites

- Node.js 20+ and npm
- Java 21 (JDK)
- Maven 3.9+ or the included Maven wrapper (`mvnw` / `mvnw.cmd`) — no global Maven install required
- Docker + Docker Compose (for containerized run / migration test)
- A YouTube Data API v3 key with the YouTube Data API enabled

Maven commands below use the included wrapper (`.\mvnw.cmd` on Windows, `./mvnw` on macOS/Linux), so you do not need `mvn` on your PATH.

---

## Quick start (local development)

### 1. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum:

```dotenv
DATABASE_URL=jdbc:postgresql://localhost:5432/youdemy
DATABASE_USERNAME=youdemy
DATABASE_PASSWORD=change-me
DATABASE_NAME=youdemy
JWT_SECRET=replace-with-at-least-32-random-characters
YOUTUBE_API_KEY=your-youtube-data-api-v3-key
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
VITE_API_BASE_URL=/api
```

Generate a strong JWT secret, for example:

```bash
openssl rand -base64 48
```

When you run the backend locally from `backend/`, Spring Boot automatically imports the root `.env` file. Restart the backend after changing it. Environment variables still take precedence over `.env` values.

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

Flyway applies `backend/src/main/resources/db/migration/V1__initial_schema.sql` automatically on backend startup.

**No PostgreSQL installed?** Use the file-backed H2 local profile instead. No Docker or database setup is required:

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

On macOS/Linux, use `./mvnw spring-boot:run -Dspring-boot.run.profiles=local` instead. In PowerShell, keep the quotes around the `-D` argument; otherwise PowerShell splits it at the dots.

This profile creates the schema from the JPA entities and stores data in `backend/data/youdemy.mv.db`, so accounts, playlists, progress, and notes survive backend restarts. It is for local development only; production and Compose use PostgreSQL. Playlist import still requires a valid `YOUTUBE_API_KEY`.

To reset local H2 data, stop the backend and delete `backend/data/youdemy.mv.db`.

### 3. Run the backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The API listens on <http://localhost:8080>. Health check: <http://localhost:8080/actuator/health>.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

No `frontend/.env` is required: the Vite dev server proxies `/api` requests to `http://localhost:8080`. In Docker Compose, Nginx performs the same proxying to the `backend` service.

---

## Quick start (Docker Compose)

```bash
cp .env.example .env
# edit .env with real JWT_SECRET, DATABASE_PASSWORD, and YOUTUBE_API_KEY
docker compose up --build
```

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:3000> |
| Backend API | <http://localhost:8080/api> |
| PostgreSQL | `localhost:5432` |

Redis is optional:

```bash
docker compose --profile cache up -d
```

To stop and remove database data:

```bash
docker compose down -v
```

---

## API overview

All responses use:

```json
{ "success": true, "data": {}, "message": "...", "timestamp": "..." }
```

Errors use a matching envelope with `code`, `message`, optional `fieldErrors`, `path`, and `timestamp`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account, returns JWT |
| POST | `/api/auth/login` | Sign in, returns JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/playlists/import` | Import a YouTube playlist URL |
| GET | `/api/user/playlists` | Current user's playlists |
| GET | `/api/playlists/{id}` | Playlist summary |
| DELETE | `/api/playlists/{id}/remove` | Remove from library (progress/notes retained) |
| PUT | `/api/playlists/{id}/last-watched` | Set resume point |
| POST | `/api/playlists/{id}/resync` | Refresh from YouTube |
| GET | `/api/playlists/{id}/videos` | Paginated videos with completion state |
| GET | `/api/playlists/{id}/progress` | Progress summary |
| POST | `/api/videos/{id}/complete` | Mark complete (idempotent) |
| POST | `/api/videos/{id}/uncomplete` | Mark incomplete (idempotent) |
| GET | `/api/videos/{id}/notes` | Get private note |
| PUT | `/api/videos/{id}/notes` | Upsert note with optional `version` |
| GET | `/api/user/dashboard` | Stats, continue-learning, recent activity |
| GET | `/api/user/recently-watched` | Recently accessed playlists |
| GET | `/api/user/completed-videos` | Completed video activity |

Send the JWT as `Authorization: Bearer <token>`.

---

## Configuration

Environment variables are read by Spring Boot from `application.yml`:

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/youdemy` | JDBC URL |
| `DATABASE_USERNAME` | `youdemy` | DB user |
| `DATABASE_PASSWORD` | `change-me` | DB password |
| `DATABASE_NAME` | `youdemy` | Compose Postgres database name |
| `JWT_SECRET` | dev placeholder | HS384 signing secret; set a long random value |
| `SPRING_PROFILES_ACTIVE` | default (PostgreSQL) | Set to `local` to use file-backed H2; no database install needed |
| `JWT_ACCESS_MINUTES` | `1440` | Token lifetime |
| `YOUTUBE_API_KEY` | empty | YouTube Data API v3 key |
| `APP_CORS_ALLOWED_ORIGINS` | localhost:5173,localhost:3000 | Comma-separated allowed origins |
| `SERVER_PORT` | `8080` | Backend port |
| `VITE_API_BASE_URL` | `/api` | API base URL baked into the SPA; Vite proxies `/api` in dev and Nginx proxies it in Docker |

Important: without `YOUTUBE_API_KEY`, importing a new playlist returns `503 YOUTUBE_API_ERROR` with a clear message. Playlists already in the database can still be opened because their metadata is cached locally.

---

## Testing

### Backend

```powershell
cd backend
.\mvnw.cmd test
```

- JUnit 5 + MockMvc integration tests use H2 with Flyway disabled
- `@Transactional` keeps each test isolated
- `PostgresMigrationTest` uses Testcontainers and automatically skips when Docker is unavailable
- YouTube API calls are mocked; no quota is consumed by the test suite

Current result: **16 tests run, 0 failures, 0 errors, 1 skipped** (skipped test requires Docker).

### Frontend

```bash
cd frontend
npm test
npm run typecheck
npm run build
```

Vitest + React Testing Library cover authentication flows, playlist rendering/filtering/import, learning-page resume/navigation/completion, notes autosave and failure handling, plus loading/error states.

Current result: **17 tests passed**, TypeScript production build succeeds.

---

## Project structure

```text
.
├── backend/
│   ├── Dockerfile
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── .mvn/wrapper/maven-wrapper.properties
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/youdemy/
│       │   ├── auth/         registration, login, /me
│       │   ├── config/       security, JWT, CORS
│       │   ├── common/       envelope, errors, exceptions
│       │   ├── dashboard/    stats and activity
│       │   ├── notes/        versioned note upsert
│       │   ├── playlist/     import, query, access checks
│       │   ├── progress/     completion aggregation
│       │   ├── user/         user directory
│       │   ├── video/        video listing
│       │   └── youtube/      URL parsing, API client, orchestration
│       └── resources/
│           ├── application.yml
│           └── db/migration/V1__initial_schema.sql
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── __tests__/        Vitest/RTL suites
│       ├── auth/             AuthProvider
│       ├── components/       UI, layout, playlists, notes, video
│       ├── hooks/            TanStack Query hooks
│       ├── pages/            dashboard, library, learning, settings, auth
│       ├── test/             test setup and helpers
│       └── types/            shared API types
├── docker-compose.yml
├── .env.example
├── PROGRESS.md
└── README.md
```

---

## Data model

The initial Flyway migration creates:

- `users` — credentials and account metadata
- `playlists` — shared YouTube playlist metadata
- `videos` — ordered videos belonging to a playlist
- `user_playlists` — per-user library association, last access, last watched video
- `user_video_progress` — per-user completion state
- `notes` — per-user note content with a `@Version` column for optimistic locking

Indexes cover user lookups, playlist/video ownership, and progress aggregation.

---

## Notes on design decisions

- **Shared playlist rows:** multiple users importing the same YouTube playlist reuse one `playlists` row and one set of `videos`; only the `user_playlists` association is per-user.
- **Import locking:** a per-playlist `ReentrantLock` surrounds a `TransactionTemplate`, so two concurrent imports cannot create duplicate metadata.
- **Optimistic notes:** the backend rejects stale `version` values with HTTP 409, and the frontend sequences autosaves so an older response cannot overwrite a newer one.
- **Ownership first:** access checks run before returning playlist, video, progress, or note data; another user's resources return 404 rather than leaking existence.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `YOUTUBE_API_ERROR` on import | Set a valid `YOUTUBE_API_KEY` and enable YouTube Data API v3 in Google Cloud. |
| Backend cannot connect to DB | Make sure Postgres is running and `DATABASE_*` values match `.env`, or run the local H2 profile with `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"`. |
| Flyway checksum error | Do not edit applied migrations; add a new `V2__...sql` migration. |
| Frontend API 404 on direct route refresh | Nginx `try_files` fallback to `index.html` is configured in `frontend/nginx.conf`. |
| Docker healthcheck fails | Confirm the backend is listening on 8080 and Postgres/backend containers are healthy via `docker compose ps`. |
| Testcontainers migration test skipped | Docker daemon is not running; the rest of the suite still runs. |

---

## License

This project is provided as-is for demonstration and development purposes.
