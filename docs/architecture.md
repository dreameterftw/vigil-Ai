# VIGIL — Architecture

## Overview

VIGIL uses a **Firebase-first architecture** to stay within zero budget while demonstrating the full product concept.

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  Dashboard · Watchtower · Scam Checker · Payments        │
│  DealLock · Cases · VIGIL Invest · Settings              │
└────────────────────────┬────────────────────────────────┘
                         │ Firebase SDK (callable functions)
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    Firebase Auth   Firestore      Cloud Functions
                        │                │
                    Real-time        Business Logic
                   subscriptions    ─────────────
                                    Risk Engine
                                    Scam Checker (Gemini)
                                    Watchtower
                                    Payment Risk
                                    VIGIL Invest
                                    Cases / Samadhaan

                                        +

                              Polygon Amoy Testnet
                                   (DealLock)
```

## Key Decisions

### Firebase instead of Express + PostgreSQL + Redis
- Zero infrastructure cost
- Firestore real-time listeners enable live risk index updates without polling
- Cloud Functions replace a separate API server
- Firebase Auth handles all authentication

### Deterministic rules + Gemini Flash
- Rule engine always runs first — works even if Gemini is unavailable
- Gemini provides explanation text and catches edge cases
- Gemini Flash is free tier (15 RPM, 1M tokens/day)

### Blockchain only for DealLock
- On-chain: terms hash, timestamp, wallet addresses, stake, penalty, state
- Off-chain (Firestore): readable deal details, case info, evidence, user data
- Polygon Amoy: free testnet, no real money

## Data Flow

### Continuous Risk Update
```
User action (scam check / payment / deal)
       ↓
Cloud Function (module-specific logic)
       ↓
addRiskEvent() → writes to riskEvents collection
       ↓
applyEvent() → updates riskProfiles collection
       ↓
Firestore real-time listener in browser
       ↓
Dashboard updates live (no page refresh needed)
```

### Scam Analysis
```
User pastes text
      ↓
analyzeScam() Cloud Function
      ↓
Rule engine (deterministic, always runs)
      ↓
Gemini Flash (explanation + edge cases)
      ↓
Combined result → stored in scamReports
      ↓
If HIGH/CRITICAL → addRiskEvent()
      ↓
Risk index updates live
```
