# VIGIL

> **AI-powered continuous cyber risk quantification and investment optimization platform for MSMEs.**

VIGIL continuously monitors cyber and transaction risk, quantifies business exposure, protects B2B deals via blockchain, and guides safer capital allocation.

---

## Core Loop

```
OBSERVE → ANALYZE → QUANTIFY → PROTECT → RECOVER → OPTIMIZE
```

| Module | Purpose |
|---|---|
| **Cyber Risk Engine** | Continuously calculates the VIGIL Cyber Risk Index from all signals |
| **Company Watchtower** | Verify counterparties via GSTIN / PAN / Bank evidence checklist |
| **Scam Checker** | AI + rule-based analysis of suspicious messages, emails, invoices |
| **Payment Risk** | Contextual risk for individual payments vs. monthly outflow |
| **DealLock** | Blockchain-enforced B2B deal protection on Polygon Amoy testnet |
| **Case Tracker** | Evidence-backed case management + Samadhaan complaint drafts |
| **VIGIL Invest** | Educational capital allocation guidance adjusted for cyber risk |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Firebase Cloud Functions (TypeScript) |
| Database | Firestore |
| Auth | Firebase Authentication |
| AI | Groq (llama-3.3-70b-versatile) — free tier |
| Blockchain | Solidity, Hardhat, Polygon Amoy testnet |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
VIGIL/
├── apps/
│   └── web/                  # Next.js frontend
├── functions/                # Firebase Cloud Functions (backend)
├── blockchain/
│   └── deallock/             # Hardhat project — DealLock smart contract
├── packages/
│   ├── types/                # Shared TypeScript interfaces
│   ├── constants/            # Shared enums and constants
│   └── config/               # Shared configuration
├── firestore/
│   ├── firestore.rules       # Security rules
│   └── firestore.indexes.json
├── scripts/                  # Demo seed / reset scripts
├── docs/                     # Architecture and feature docs
├── firebase.json
├── .firebaserc
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8 — `npm install -g pnpm`
- Firebase CLI — `npm install -g firebase-tools`
- Java 11+ (required for Firebase emulators)
- A browser wallet that supports EIP-1193, such as Coinbase Wallet, Rabby, or Brave Wallet (for DealLock)

### Setup

```bash
# 1. Clone
git clone https://github.com/QuanTaLPha06/VIGIL.git
cd VIGIL

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Fill in your Firebase project values + API keys (see below)

# 4. Start Firebase emulators
pnpm emulate

# 5. Start the web app (separate terminal)
pnpm dev
```

Open http://localhost:3000 — login with demo@vigil.in / demo123 after seeding.

### Seed demo data

```bash
# With emulators running:
FIRESTORE_EMULATOR_HOST=localhost:8080 pnpm seed
```

### Blockchain (DealLock)

```bash
# Compile contract
pnpm blockchain:compile

# Run tests (local Hardhat node — no wallet needed)
pnpm blockchain:test

# Deploy to Polygon Amoy testnet
# Requires PRIVATE_KEY set in .env.local + testnet ETH in that wallet
pnpm blockchain:deploy
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings → Your apps |
| `GROQ_API_KEY` | console.groq.com/keys (free, no credit card) |
| `PRIVATE_KEY` | Fresh test wallet private key — never use a real wallet |
| `NEXT_PUBLIC_POLYGON_AMOY_RPC_URL` | Default: `https://rpc-amoy.polygon.technology` (free, no signup) |
| `NEXT_PUBLIC_DEALLOCK_CONTRACT_ADDRESS` | Output of `pnpm blockchain:deploy` |

### Get free testnet POL for Polygon Amoy

- Coinbase faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- QuickNode faucet: https://faucet.quicknode.com/base/sepolia
- Alchemy faucet: https://basefaucet.com/

---

## Demo Flow (5 minutes)

1. **Verify counterparty** — Watchtower → Evidence Checklist (GSTIN/PAN/Bank)
2. **Create protected deal** — DealLock → Terms hash → Polygon Amoy proof → PolygonScan link
3. **Simulate risk events** — Large payment + suspicious message → Risk 32 → 61 (live chart)
4. **Simulate DealLock breach** — Penalty logic → on-chain proof
5. **Case + recovery** — Evidence package + interest calculator + Samadhaan draft
6. **Investment optimization** — Cash → risk reserve deducted → deployable surplus → allocation bands

See `docs/demo-flow.md` for the full judge-ready script.

---

## What This Is NOT

- ❌ Not a production financial system
- ❌ Not real-money escrow
- ❌ Not regulated investment advice
- ❌ Not a WhatsApp bot
- ❌ Not connected to live government APIs

This is a **hackathon prototype** demonstrating the concept.

---

## Team

| Developer | Responsibility |
|---|---|
| Dev 1 | Next.js dashboard + UI |
| Dev 2 | Firebase Functions + Firestore |
| Dev 3 | DealLock + Solidity + Polygon Amoy |
| Dev 4 | Scam Checker + Groq AI integration |
| Dev 5 | Watchtower + Risk Engine + VIGIL Invest |
