# Contributing to LedgerLoop

Welcome to LedgerLoop! This guide gets the project running locally. LedgerLoop is **two independent apps** — `client/` and `server/` — each managed with their own `pnpm install`. There is no root-level install step.

---

## Prerequisites

- **Node.js** (v20+) — [Download here](https://nodejs.org/)
- **pnpm** (v11.10.0+) — `npm install -g pnpm`
- **Docker & Docker Compose** — [Install here](https://docs.docker.com/get-docker/)
- **Git**

### Verify Installations

```bash
node --version
pnpm --version
docker --version
docker compose --version
```

---

## Project Structure

```
ledger-loop/
├── client/                        # Next.js frontend (React 19)
│   └── src/
│       ├── app/                   # App Router pages
│       ├── components/            # React components (incl. components/ui — shadcn)
│       ├── context/                # AuthContext
│       └── lib/                    # axios instance, constants, utils
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── app.ts                 # Express app, session/redis/cors setup
│   │   ├── server.ts              # Entry point
│   │   ├── api/v1/index.ts        # Mounts every module router — the source of truth for URL prefixes
│   │   ├── modules/
│   │   │   ├── auth/              # signup, login, logout, session (controller/service/schema/routes)
│   │   │   ├── accounts/          # account CRUD, balance, transaction history
│   │   │   ├── ledger/            # journal entry creation (double-entry, balance-checked)
│   │   │   └── import/            # CSV parse → validate → stage → commit
│   │   └── shared/
│   │       ├── middleware/        # requireAuth
│   │       └── utils/             # prisma client, error classes, asyncHandler, multer config
│   ├── prisma/                    # schema.prisma, migrations, seed.ts
│   └── docker-compose.yml
│
└── README.md
```

**Module pattern:** each module under `server/src/modules/` is self-contained — its own `*.controller.ts`, `*.service.ts`, `*.schema.ts` (Zod), and `*.routes.ts`. A module's routes only become live at the prefix it's mounted under in `api/v1/index.ts` — the routes file itself defines only the *sub-paths*. See [API Endpoints](#api-endpoints) below for the full resolved list, and don't assume a route lives under `/ledger` just because its logic is ledger-adjacent — check the mount.

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/KingsCreatives/ledger-loop.git
cd ledger-loop
```

---

## Step 2: Set Up Docker Services

```bash
cd server
docker compose up -d
docker compose ps
```

This starts:

- **PostgreSQL** on port `5435` (pgweb UI on `8085`)
- **Redis** on port `6379` (redis-commander UI on `8081`)

The server will fail to accept requests correctly if Redis isn't reachable — `app.ts` connects to Redis at startup for the session store, so start Docker **before** `pnpm dev`.

---

## Step 3: Configure Environment Variables

### `server/.env`

```env
DATABASE_URL=postgresql://postgres:password123@localhost:5435/ledger_loop

PORT=5000
NODE_ENV=development

SESSION_SECRET=your_secure_random_string_here_min_32_chars

DB_NAME=ledger_loop
DB_USER=postgres
DB_PASSWORD=password123

REDIS_UI_USER=admin
REDIS_UI_PASSWORD=admin123
```

Generate `SESSION_SECRET`:

```bash
openssl rand -base64 32
```

### `client/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Every client-side `api.get(...)` / `api.post(...)` call is relative to this base — e.g. `api.get('/accounts')` resolves to `http://localhost:5000/api/v1/accounts`.

---

## Step 4: Install Dependencies

```bash
cd server && pnpm install
cd ../client && pnpm install
```

---

## Step 5: Set Up the Database

```bash
cd server
pnpm exec prisma migrate deploy
pnpm exec prisma db seed        # optional — seeds a test user + sample accounts
```

Seeded login: email `finance_admin_9819@example.com`, password `password123` (check server logs for the exact generated email).

View data: `pnpm exec prisma studio` → `http://localhost:5555`

---

## Step 6: Start the Development Servers

```bash
# Terminal 1
cd server && pnpm dev     # Server is listening PORT:5000

# Terminal 2
cd client && pnpm dev     # ▲ Next.js — Local: http://localhost:3000
```

---

## Verification Checklist

- [ ] **Backend**: `http://localhost:5000/api/v1/auth/me` responds (401 if logged out is correct — that means it's up)
- [ ] **Frontend**: `http://localhost:3000` loads
- [ ] **pgweb**: `http://localhost:8085`
- [ ] **Redis Commander**: `http://localhost:8081`

---

## API Endpoints

All routes are mounted under `/api/v1` in `server/src/api/v1/index.ts`. **The prefix a router is mounted at, plus the sub-path defined inside that router file, is the entire URL — always check both.**

### Auth — mounted at `/auth` (`auth.routes.ts`)

| Method | Path | Auth required |
|---|---|---|
| POST | `/auth/signup` | No |
| POST | `/auth/login` | No |
| POST | `/auth/logout` | No |
| GET | `/auth/me` | Yes |

### Accounts — mounted at `/accounts` (`account.routes.ts`), all routes require auth

| Method | Path |
|---|---|
| GET | `/accounts` |
| POST | `/accounts` |
| GET | `/accounts/:accountId` |
| GET | `/accounts/:accountId/balance` |
| GET | `/accounts/:accountId/transactions` |

### Ledger — mounted at `/ledger` (`ledger.routes.ts`), requires auth

| Method | Path | Notes |
|---|---|---|
| POST | `/ledger` | Creates a balanced journal entry (2+ lines, debits = credits) |

### Import — mounted at `/import` (`import.routes.ts`)

| Method | Path | Notes |
|---|---|---|
| POST | `/import/parse` | Multipart, field name `file`; parses + validates CSV, stages an `ImportBatch` |
| POST | `/import/commit` | Body: `{ batchId, offsetAccountId }`; commits staged rows as journal entries |

---

## Common Commands

### Backend (`server/`)

```bash
pnpm dev                                        # dev server with hot-reload (nodemon + tsx)
pnpm test                                        # jest
pnpm exec prisma migrate dev --name "name"        # new migration
pnpm exec prisma migrate reset                    # reset db (dev only)
pnpm exec prisma migrate status
pnpm exec prisma studio
```

### Frontend (`client/`)

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

### Docker (`server/`)

```bash
docker compose up -d
docker compose down
docker compose logs -f postgres
docker compose logs -f redis
```

---

## Troubleshooting

**Client requests 404 that "should" work** — almost always a stale path from before the module restructure (e.g. `/ledger/accounts` instead of `/accounts`). Check the route table above, not the folder the logic lives in.

**Docker permission denied** (Linux/Mac):

```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Port already in use**:

```bash
lsof -ti:5000 | xargs kill -9   # backend
lsof -ti:3000 | xargs kill -9   # frontend
```

**`DATABASE_URL` connection error** — confirm Docker is up (`docker compose ps`) and `.env` matches `docker-compose.yml`: host `localhost`, port `5435` (not `5432`), user `postgres`, password matches `DB_PASSWORD`.

**Server hangs or session/auth calls fail silently** — check Redis is running; `app.ts` needs a live Redis connection for the session store at startup.

**Prisma Client not generated**:

```bash
cd server && pnpm exec prisma generate
```

**Dependencies won't install**:

```bash
pnpm store prune
pnpm install
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | Next.js 16 | App Router, routing |
| Frontend language | TypeScript 5 | Type-safe frontend |
| Frontend UI | Radix UI + Tailwind CSS v4 | Components & styling |
| Backend framework | Express 5 | REST API |
| Backend language | TypeScript 5.9 | Type-safe backend |
| ORM | Prisma 7 | DB abstraction & migrations |
| Database | PostgreSQL | Primary data store |
| Sessions | Redis + connect-redis + express-session | Session storage |
| Validation | Zod 4 | Request/row validation |
| File upload | Multer + csv-parser | CSV import pipeline |
| Testing | Jest + ts-jest | Unit tests |
| Dev tools | nodemon + tsx | Auto-reload |

---

## Contributing Guidelines

1. Branch from `develop`: `git checkout -b feature/your-feature-name`
2. Make your changes and test thoroughly (`pnpm test` in `server/`)
3. Commit using conventional commits: `git commit -m "feat(accounts): add account archiving"`
4. Push and open a Pull Request with a clear description

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/KingsCreatives/ledger-loop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KingsCreatives/ledger-loop/discussions)
- **Documentation**: [README.md](./README.md)

---

Thank you for contributing to LedgerLoop!