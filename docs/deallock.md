# DealLock — Blockchain Deal Protection

## What It Does

DealLock creates tamper-evident proof of B2B deal terms on Polygon Amoy testnet
and demonstrates automatic penalty enforcement via a smart contract.

## On-Chain vs Off-Chain

| Layer | What's stored |
|---|---|
| **Firestore (off-chain)** | Readable deal details, seller name, description, status history |
| **Polygon Amoy (on-chain)** | Terms hash, wallet addresses, stake, penalty %, state, timestamps |

## Deal Flow

```
1. Buyer fills form (seller address, amount, deadline, penalty %)
        ↓
2. Frontend generates SHA-256 hash of canonical terms JSON
        ↓
3. createDeal() called on DealLock contract (optional ETH stake)
        ↓
4. Transaction confirmed on Polygon Amoy → tx hash stored
        ↓
5. Seller calls confirmDeal() → deal becomes Active
        ↓
6a. On completion → completeDeal() → stake returned to buyer
6b. On breach → reportBreach() → penalty paid to non-breaching party
```

## Smart Contract States

```
Pending → Active → Completed
                → Breached
Pending → Cancelled
```

## Deploying

```bash
# 1. Get free testnet POL on Polygon Amoy
# Coinbase faucet:  https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
# QuickNode faucet: https://faucet.quicknode.com/base/sepolia
# Alchemy faucet:   https://basefaucet.com/

# 2. Set PRIVATE_KEY in .env.local (fresh test wallet only)

# 3. Deploy
pnpm blockchain:deploy

# 4. Copy the contract address to .env.local:
# NEXT_PUBLIC_DEALLOCK_CONTRACT_ADDRESS=0x...
```

## Testing

```bash
pnpm blockchain:test
```

Tests cover: createDeal, confirmDeal, getDeal, penalty payout, stake return, completeDeal, invalid state transitions.

## Important

- **Testnet only** — Polygon Amoy, no real money
- The terms hash is SHA-256 of the canonical JSON — tamper-evident
- Even after a dispute, the original terms hash remains on-chain permanently
- Transactions visible at: https://amoy.polygonscan.com
