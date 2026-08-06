<div align="center">

# LedgerLoop 

### Double-Entry Bookkeeping with Automated Bank Reconciliation

**Upload a bank statement. LedgerLoop reconciles it against your ledger.**

[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)](https://github.com/KingsCreatives/ledger-loop)
[![TypeScript](https://img.shields.io/badge/TypeScript-97%25-3178C6?style=flat-square&logo=typescript)](https://github.com/KingsCreatives/ledger-loop)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](https://github.com/KingsCreatives/ledger-loop/pulls)

</div>

---

## The Problem

Every finance team knows the pain. At the end of the month, an accountant opens two spreadsheets, the bank statement, the internal ledger and manually compares them line by line. Hundreds of transactions. Hours of work. One misplaced decimal ruins everything.

> I've done this myself, reconciling **GHC 80M+ in daily vault transactions** at Ghana Commercial Bank. LedgerLoop is built from that experience, not a tutorial.

LedgerLoop is a full-stack personal/small-business finance app built around proper **double-entry bookkeeping**, with bank statement import and automated reconciliation as its core, differentiating feature.

---

##  What It Does Today

- **Multi-user auth** — session-based signup/login, every ledger query scoped to the logged-in user
- **Double-entry ledger** — accounts (Assets, Liabilities, Equity, Revenue, Expense), balanced journal entries, running balances
- **CSV import pipeline** — upload a bank statement, rows are parsed and validated (Zod), staged for review with per-row error reporting, then committed as balanced journal entries against a chosen account
- **Account & transaction views** — per-account balance and transaction history

## What's Next

- **Reconciliation engine** — matching imported transactions against manually entered ones, flagging duplicates and mismatches (the core differentiator — not started yet)
- **OAuth** (Google/Microsoft) as a polish-phase addition alongside password auth
- **Deployment**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI / shadcn |
| Backend | Express 5, TypeScript |
| Database | PostgreSQL via Prisma 7 |
| Sessions | Redis (`connect-redis` + `express-session`) |
| Auth | bcrypt password hashing, session cookies |
| Validation | Zod |
| File handling | Multer (upload) + `csv-parser` |
| Tooling | pnpm, Jest, conventional commits, gitflow |

---

## Architecture

The backend is organized by **feature module**, not by technical layer:

```
server/src/modules/
├── auth/        # signup, login, logout, session
├── accounts/    # account CRUD, balances, transaction history
├── ledger/      # journal entries (double-entry, balance-checked)
└── import/      # CSV parsing, row validation, staged import, commit
```

Each module owns its controller, service, and schema. Routers are mounted in `server/src/api/v1/index.ts` under a prefix that matches the module name — e.g. the `accounts` module is mounted at `/api/v1/accounts`, not under `/ledger`. This mapping is the single source of truth for API paths; see [CONTRIBUTION.md](./CONTRIBUTION.md#api-endpoints) for the full endpoint list.

**CSV Import Flow:**

```
Upload CSV ──▶ Parse rows ──▶ Validate (Zod) ──▶ Stage as ImportBatch
                                                         │
                                                         ▼
                                          Review valid/invalid rows
                                                         │
                                                         ▼
                                    Commit ──▶ Balanced journal entries
```

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| 1 | Multi-user auth (sessions, hashing, scoped queries) | ✅ Done |
| 2 | Accounts API + UI | 🔄 API done, UI in progress |
| 3 | CSV import (parse, validate, stage, commit) | 🔄 Backend done, frontend upload/preview UI pending |
| 4 | Reconciliation engine | ⏳ Planned — the core differentiating feature |
| 5 | OAuth, polish, deployment | ⏳ Planned |

---

## Local Setup

LedgerLoop is two independent apps — `client/` (Next.js) and `server/` (Express) — each with its own dependencies. For full setup instructions (Docker services, environment variables, migrations, seeding), see **[CONTRIBUTION.md](./CONTRIBUTION.md)**.

Quick version:

```bash
git clone https://github.com/KingsCreatives/ledger-loop.git
cd ledger-loop

# Backend
cd server && docker compose up -d && pnpm install
pnpm exec prisma migrate deploy
pnpm dev          # http://localhost:5000

# Frontend (new terminal)
cd ../client && pnpm install
pnpm dev          # http://localhost:3000
```

---

## Who Is This For?

| User | Benefit |
|---|---|
| **SME finance teams** | Eliminate monthly manual reconciliation work |
| **Accountants** | Catch discrepancies in seconds, not hours |
| **Fintech developers** | Reference implementation of double-entry bookkeeping + reconciliation |
| **Auditors** | Clear, system-generated ledger trail |

---

## Why This Exists

Most reconciliation tools are locked inside expensive ERP systems or require complex integrations. LedgerLoop is a portfolio project demonstrating both technical depth (correct double-entry accounting, transactional imports, session-based multi-tenant auth) and product completeness — inspired by the real-world pain of manual reconciliation in banking and finance environments.

<div align="center">

**⭐ Star this repo to follow the build journey**

*LedgerLoop is in active development. Watch the repo for updates.*

</div>