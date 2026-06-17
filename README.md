<div align="center">

# LedgerLoop 🔄

### Automated Bank Reconciliation Engine

**Stop reconciling manually. Let the engine do it.**

[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)](https://github.com/KingsCreatives/ledger-loop)
[![TypeScript](https://img.shields.io/badge/TypeScript-97%25-3178C6?style=flat-square&logo=typescript)](https://github.com/KingsCreatives/ledger-loop)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](https://github.com/KingsCreatives/ledger-loop/pulls)

</div>

---

## 💡 The Problem

Every finance team knows the pain. At the end of the month, an accountant opens two spreadsheets — the bank statement and the internal ledger — and manually compares them line by line. Hundreds of transactions. Hours of work. One misplaced decimal ruins everything.

> I've done this myself, reconciling **GHC 80M+ in daily vault transactions** at Ghana Commercial Bank. I built LedgerLoop because I know exactly how broken this process is.

LedgerLoop eliminates that entirely. Feed it your bank statement and your ledger. It does the rest.

---

## ✨ What It Does

```
Bank Statement (CSV/JSON)  ──┐
                              ├──▶  LedgerLoop Engine  ──▶  Reconciliation Report
Internal Ledger (CSV/JSON)  ──┘
```

- 📥 **Ingests** bank statement data and internal ledger records (CSV or JSON)
- 🔍 **Matches** transactions automatically by amount, date, and reference number
- 🚩 **Flags** unmatched entries, duplicates, and suspicious discrepancies
- 📊 **Reports** match rate, total discrepancy value, and exception summary
- ⚡ **Saves** hours of manual work per reconciliation cycle

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Language | TypeScript | Type-safe financial logic |
| Runtime | Node.js | Server-side processing |
| Data Ingestion | Custom Parser | CSV & JSON support |
| Matching Engine | Custom Algorithm | Multi-factor transaction matching |
| Output | JSON / CSV | Reconciliation reports |
| API Layer | Express (planned) | REST endpoints |
| Dashboard | TBD | Visual reconciliation UI |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   LedgerLoop Engine                  │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌───────────────┐  │
│  │ Ingestion│───▶│ Matching │───▶│   Reporting   │  │
│  │  Layer   │    │  Engine  │    │     Layer     │  │
│  └──────────┘    └──────────┘    └───────────────┘  │
│       │               │                  │           │
│  CSV/JSON       Amount + Date      Match Rate +      │
│  Parsing        + Reference        Discrepancies     │
└─────────────────────────────────────────────────────┘
```

**Matching Logic:**
A transaction is considered matched when:
1. **Amount** matches within a configurable tolerance
2. **Date** falls within an acceptable range window
3. **Reference number** or description partially matches

Unmatched entries on either side are flagged for human review.

---

## 🚧 Roadmap

> **Current Phase:** Core engine scaffolding

| Phase | Feature | Status |
|---|---|---|
| 1 | Project architecture & scaffolding | ✅ Done |
| 2 | CSV/JSON ingestion layer | 🔄 In Progress |
| 3 | Core transaction matching algorithm | ⏳ Up Next |
| 4 | Discrepancy flagging & exception reporting | ⏳ Planned |
| 5 | REST API layer (Express) | ⏳ Planned |
| 6 | Dashboard UI | ⏳ Planned |
| 7 | Multi-currency support | 💡 Future |
| 8 | Bank statement auto-import (Plaid/Mono) | 💡 Future |

---

## 🔧 Local Setup

> Full setup guide will be added once the core engine reaches v0.1.0

```bash
# Clone the repo
git clone https://github.com/KingsCreatives/ledger-loop.git
cd ledger-loop

# Install dependencies
npm install

# Run in development mode
npm run dev
```

---

## 🎯 Who Is This For?

| User | Benefit |
|---|---|
| **SME Finance Teams** | Eliminate monthly manual reconciliation work |
| **Accountants** | Catch discrepancies in seconds, not hours |
| **Fintech Developers** | Embed reconciliation logic into any financial system |
| **Auditors** | Get a clear, machine-generated audit trail |

---

## 🌍 Why This Exists

Most reconciliation tools are either locked inside expensive ERP systems (SAP, Oracle) or require complex integrations. LedgerLoop is being built as a lightweight, open-source engine that any finance team or developer can run — inspired by the real-world pain of manual reconciliation in Ghanaian banking and finance environments.

---

## 👤 Author

<a href="https://github.com/KingsCreatives" target="_blank">
  <strong>Samuel Kingsford Amoah</strong>
</a>

Software engineer with direct experience in financial reconciliation, having personally managed GHC 80M+ in daily vault audits at Ghana Commercial Bank and GHC 18M in grant portfolios at Environment360. LedgerLoop isn't a side project built from tutorials. It's built from domain expertise.

- 🔗 <a href="https://linkedin.com/in/samuel-kamoah" target="_blank">LinkedIn</a>
- 💻 <a href="https://github.com/KingsCreatives" target="_blank">GitHub</a>
- 📧 skamoah882@gmail.com

---

<div align="center">

**⭐ Star this repo to follow the build journey**

*LedgerLoop is in active development. Watch the repo for updates.*

</div>
