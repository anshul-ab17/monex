# Monex — System Design

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│   Browser (Next.js)   ·   Mobile (future)   ·   API consumers  │
└───────────────┬─────────────────────────────────────────────────┘
                │ HTTP / WebSocket (protobuf binary over WS)
                ▼
┌──────────────────────────┐      ┌──────────────────────────────┐
│   apps/server            │      │   apps/ws-gateway            │
│   Bun + Fastify API      │◄────►│   WebSocket real-time feed   │
│   - Auth                 │      │   protobuf binary wire fmt   │
│   - Orders               │      └──────────────────────────────┘
│   - Markets              │
│   - Deposits/Withdrawals │
│   - Wallet               │
└───────┬──────────────────┘
        │ Publish events
        ▼
┌──────────────────────────┐
│   Redpanda (Kafka)       │   Topics: auth · orders · trades ·
│   Event Bus              │           ledger · wallets · risk ·
└───────┬──────────────────┘           market-data · notifications
        │ Consume events
        ▼
┌──────────────────────────┐      ┌──────────────────────────────┐
│   Kafka Consumers        │      │   apps/engine/v2             │
│   (in apps/server)       │      │   Matching Engine (Rust)     │
│   - order.consumer       │◄────►│   tokio · rdkafka · prost    │
│   - trade.consumer       │      │   - Price-time FIFO          │
│   - wallet.consumer      │      │   - Stop orders              │
│   - auth.consumer        │      │   - Monitoring               │
└───────┬──────────────────┘      └──────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────┐
│                 Storage Layer                     │
│  PostgreSQL 17      Redis 8        Solana RPC     │
│  (Prisma ORM)       (ioredis)      (web3.js)      │
│  - Orders           - Sessions     - Deposits     │
│  - Balances         - Nonces       - Withdrawals  │
│  - Trades           - Bal Cache    - Balances     │
│  - Ledger           - Mkt Cache    - Signatures   │
│  - Markets          - OB Snapshots                │
└───────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles

```
Events   = Contracts   (packages/events — pure TypeScript, no transport deps)
Kafka    = Transport   (packages/kafka  — broker connection, retry, DLQ)

Redis    = State       (sessions, nonces, caches, snapshots)
Kafka    = Events      (async processing, service decoupling)
Postgres = Source of Truth (persistent state)

Matching Engine = decides WHAT happened
Ledger Service  = decides WHAT MONEY MOVED

Ledger Entries  = immutable (INSERT only, never UPDATE, never DELETE)
Balances        = projections (derived from ledger, not authoritative)
Ledger Service  = sole financial writer
```

---

## 3. Package Responsibilities

| Package | Responsibility |
|---------|---------------|
| `apps/server` | HTTP API, plugin wiring, route handlers, Kafka consumers |
| `apps/web` | Next.js frontend |
| `apps/engine/v2` | Order matching engine — Rust, tokio, rdkafka, prost; price-time FIFO, stop orders, monitoring |
| `apps/ws-gateway` | WebSocket server — real-time order book & trade feed; protobuf binary wire format |
| `packages/db` | Prisma schema, migrations, typed Prisma client |
| `packages/kafka` | Kafka client, generic `publish<T>()` / `subscribe<T>()`, graceful disconnect |
| `packages/events` | Typed event contracts (no Kafka, no transport — contracts only) |
| `packages/proto` | Protobuf schemas + generated TS bindings (protobufjs); Rust uses prost in engine |
| `packages/solana` | RPC client, wallet derivation, deposit detection, tx building, sig verify |
| `packages/ledger` | Double-entry accounting — type exports (SettleTradeInput, ReserveInput, etc.) + credit/debit fns |
| `packages/redis` | Redis client + constructor export, session, nonce, cache, Pub/Sub |
| `packages/config` | Env variable parsing with Zod — includes `USE_KAFKA` feature flag |
| `packages/types` | Shared TypeScript contracts — JWT payloads, enums, WS payloads, DTOs (no Zod, no Fastify, no Prisma) |
| `packages/validation` | Zod schemas for runtime validation only — no business logic, no Redis, no Kafka |

---

## 4. Request Lifecycle — Place Order

```
Client POST /api/v1/orders
  → Fastify route handler
  → Zod validation (packages/validation — LIMIT requires price; MARKET must not have price)
  → Auth middleware (verify JWT from Redis session)
  → OrderService.create()
      → Validate market exists & is active
      → Check user balance (packages/ledger)
      → Reserve funds (DEBIT available → locked) via Ledger Service
      → INSERT Order (status=PENDING) via Prisma
      → Publish ORDER_CREATED event → Kafka `orders` topic
  → Return { orderId, status: "PENDING" }

Kafka Consumer (order.consumer.ts)
  → Receive ORDER_CREATED
  → Forward to matching engine (via Kafka or direct call)
  → Engine produces TRADE events → `trades` topic

Trade Consumer (trade.consumer.ts)
  → Receive TRADE_EXECUTED
  → Ledger Service: settle-trade (atomic — buyer credit, seller debit, fee deduction)
  → UPDATE Order status (OPEN → FILLED / PARTIALLY_FILLED)
  → INSERT Trade record
  → Publish notifications
```

---

## 5. Authentication Flow

```
1. Client GET  /api/v1/auth/nonce?wallet=<pubkey>
   → Server generates random nonce
   → Stores nonce in Redis (TTL 5 min) keyed by wallet address
   → Returns { nonce }

2. Client signs nonce with Solana wallet (off-chain, in browser)
   → Returns base58-encoded signature

3. Client POST /api/v1/auth/wallet { wallet, signature, nonce }
   → Server verifies signature via TweetNaCl / Solana web3.js (packages/solana)
   → Deletes nonce from Redis REGARDLESS of result (prevent replay)
   → UPSERT User by walletAddress
   → Creates Session (JWT access + refresh tokens)
   → Auto-create LedgerAccount for new user
   → Returns { accessToken, refreshToken }

4. All subsequent requests: Authorization: Bearer <accessToken>
   → Fastify JWT plugin verifies token
   → Session validated against Redis
```

---

## 6. Deposit Flow (MVP)

```
MVP design: deposit(txHash)
Blockchain is source of truth.

1. User sends SPL token tx on Solana to their derived deposit address
2. User submits: POST /deposit { txHash }
3. Server calls packages/solana → getTransaction(txHash)
4. parseTokenTransfer() extracts amount + recipient
5. Validate recipient == user's derived wallet address
6. Wait for N confirmations
7. Ledger Service: credit(userAccount, amount, assetId)
8. INSERT Deposit record (status=CONFIRMED)

Future (deferred):
- Blockchain watcher (poll/webhook for auto-detection)
- Admin credits
- Manual adjustments
- Fiat deposits
- Multi-chain deposits
```

---

## 7. Ledger System

Monex uses **double-entry accounting** — every balance change is a pair of entries that must net to zero. **The ledger is the source of truth; balances are projections.**

```
Accounts:
  USER       — per-user per-asset balance account
  EXCHANGE   — platform liquidity
  FEES       — fee collection
  TREASURY   — reserve funds

Operations:
  credit(account, amount)        — increase balance
  debit(account, amount)         — decrease balance
  transfer(from, to, amount)     — atomic move between accounts
  reserve(account, amount)       — move available → locked
  release(account, amount)       — move locked → available
  settleTrade(buyer, seller, …)  — atomic swap + fee deduction

Rules:
  Debits == Credits (always balanced)
  INSERT only — NEVER UPDATE or DELETE ledger entries
  All operations run inside Prisma $transaction (atomic)
  Ledger Service is the ONLY service that writes to ledger
```

```
LedgerJournal
    ├── LedgerEntry (debit)
    ├── LedgerEntry (credit)
    └── ...

Journal has: referenceType, referenceId (links back to order/trade/deposit)
```

---

## 8. Order Types & Validation

```
OrderType:    LIMIT | MARKET | STOP
Side:         BUY | SELL
TimeInForce:  GTC | IOC | FOK

Flags:
  postOnly    — reject if order would immediately match (maker only)
  reduceOnly  — only allowed to reduce an existing position

Validation rules (packages/validation):
  LIMIT  → price is REQUIRED
  MARKET → price must NOT be present
  STOP   → trigger price required
```

---

## 9. Kafka Topics & Event Types

| Topic | Key Events |
|-------|-----------|
| `auth` | USER_CREATED, USER_LOGIN, SESSION_EXPIRED |
| `orders` | ORDER_CREATED, ORDER_ACCEPTED, ORDER_PARTIALLY_FILLED, ORDER_FILLED, ORDER_CANCELLED, ORDER_REJECTED, ORDER_RESERVE_REQUESTED, ORDER_RELEASE_REQUESTED |
| `trades` | TRADE_EXECUTED |
| `ledger` | FUNDS_RESERVED, FUNDS_RELEASED, BALANCE_CREDITED, BALANCE_DEBITED, TRADE_SETTLED |
| `wallets` | DEPOSIT_DETECTED, WITHDRAWAL_INITIATED, WITHDRAWAL_COMPLETED |
| `risk` | (planned) position limits, liquidation triggers |
| `market-data` | CANDLE_UPDATED, ORDERBOOK_UPDATED |
| `notifications` | (planned) user alerts |

**Deferred:** DLQ (dead-letter queue), retry strategy, partition tuning

---

## 10. Database Schema Overview

**17 Prisma models across 4 domains:**

```
Auth Domain        → User, Session, AuditLog
Trading Domain     → Market, Asset, Order, Trade, Position, OrderEvent
Financial Domain   → Balance, BalanceSnapshot, Deposit, Withdrawal
Ledger Domain      → LedgerAccount, LedgerJournal, LedgerEntry, EventStore
Market Data        → Candle, Outcome
```

**Key Prisma rules:**
- All monetary fields: `Decimal @db.Decimal(30,12)` — never Float (Float causes rounding errors)
- Performance indexes on: `marketId`, `userId`, `status`, `createdAt`

---

## 11. Fastify Plugin Architecture

```
Fastify Instance
    ├── fastify.prisma   (packages/db)
    ├── fastify.redis    (packages/redis)
    ├── fastify.kafka    (packages/kafka)
    ├── fastify.jwt      (fastify-jwt)
    ├── swagger          (@fastify/swagger + swagger-ui → /docs)
    ├── rateLimit        (@fastify/rate-limit)
    ├── audit            (Prisma middleware for financial mutations)
    └── wsPlugin         (@fastify/websocket)

apps/server structure:
  src/
  ├── controllers/
  ├── consumers/
  ├── middleware/
  ├── plugins/
  ├── publishers/
  ├── routes/
  ├── services/
  │   ├── auth/
  │   ├── ledger/
  │   ├── liquidation/
  │   ├── margin/
  │   ├── market/
  │   ├── oracle/
  │   ├── order/
  │   ├── position/
  │   ├── risk/
  │   ├── user/
  │   └── wallet/
  ├── ws/
  │   ├── ws.routes.ts
  │   ├── ws.broadcaster.ts
  │   └── ws.redis-bridge.ts
  ├── jobs/
  ├── types/
  └── utils/
```

---

## 12. Environment Variables

| Variable | Purpose | Notes |
|----------|---------|-------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:postgres@localhost:5432/monex` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing | Min 32 chars |
| `SOLANA_RPC_URL` | Solana RPC endpoint | devnet/mainnet |
| `SOLANA_MASTER_SECRET` | Master wallet private key | base58; treat as HSM secret in prod |
| `USDC_MINT` | USDC SPL token mint | |
| `USDT_MINT` | USDT SPL token mint | default set for testnet |
| `KAFKA_BROKER` | Kafka/Redpanda broker | `localhost:9092`; supports multiple |
| `USE_KAFKA` | Feature flag — enable/disable Kafka | `z.coerce.boolean()` |
| `PORT` | HTTP server port | |
| `FRONTEND_URL` | CORS allowed origin | |
| `NODE_ENV` | development / production | |

---

## 13. Infrastructure (docker-compose)

| Service | Image | Port |
|---------|-------|------|
| PostgreSQL | postgres:17 | 5432 |
| Redis | redis:8-alpine | 6379 |
| Redpanda | redpandadata/redpanda:v25.1.2 | 9092 (Kafka), 8082 (HTTP proxy), 9644 (admin) |

**Suggestion:** Add `redpandadata/console` for local topic inspection.

---

## 14. Matching Engine Design Boundaries

```
Matching Engine is allowed to:
  ✓ Manage price levels
  ✓ Maintain FIFO queues
  ✓ Execute matching logic
  ✓ Take orderbook snapshots
  ✓ Handle stop orders (trigger when price crosses level)
  ✓ Emit monitoring metrics

Matching Engine must NOT:
  ✗ Update balances
  ✗ Write to ledger
  ✗ Move funds

Rule: Engine decides WHAT happened. Ledger Service decides WHAT MONEY MOVED.
```

**Engine v2 stack (Rust):**
```
tokio         — async runtime
rdkafka       — Kafka consumer/producer (librdkafka bindings)
prost         — protobuf encoding/decoding
axum          — HTTP metrics/health endpoint
rust_decimal  — no floating point for prices/quantities
tracing       — structured logging
```

---

## 15. Wire Format & Transport Decisions

```
Protobuf = serialization format (bytes) — no transport opinions
gRPC     = RPC framework: HTTP/2 + protobuf + typed service contracts
WebSocket = bidirectional transport — native in browsers

Current stack:
  Client ↔ ws-gateway: WebSocket + protobuf binary
  Engine v2 internals:  prost (protobuf encode/decode), rdkafka (Kafka transport)
  packages/proto:       .proto schemas + protobufjs (TS) + prost (Rust)

Why NOT gRPC right now:
  - Browser clients need WebSocket, not HTTP/2 (gRPC needs gRPC-Web proxy for browsers)
  - Internal comms = async via Kafka (gRPC is synchronous RPC)
  - No service-to-service sync calls yet

When gRPC earns its place:
  - Risk Engine needs synchronous go/no-go before matching engine accepts order
  - 3+ internal services needing typed sync RPC
  - Tool: tonic (Rust gRPC, built on prost + tokio + hyper)
```

---

## 16. Future Service Architecture (Risk Engine)

When a Risk Engine is added, the recommended topology:

```
Client → WS Gateway → OMS/server ──gRPC──► Risk Engine
                                                │ approved
                                                ▼
                                     Matching Engine (engine/v2)
                                                │ TRADE_EXECUTED
                                                ▼
                                             Kafka
                                          ↙        ↘
                                 Position Svc    Market Data Svc
                                 (Kafka consumer) (Kafka consumer)
```

**Service split:**

| Service | Role | Transport In | Transport Out |
|---------|------|-------------|--------------|
| Matching Engine | Order book, FIFO, stop orders | Kafka (ORDER_CREATED) | Kafka (TRADE_EXECUTED) |
| Risk Engine | Pre-trade checks, margin, position limits | gRPC from OMS | gRPC response (approved/rejected) |
| Position Service | Real-time P&L, exposure tracking | Kafka consumer | Redis (for reads) |
| OMS (server) | Order lifecycle, state machine | HTTP from client | gRPC → Risk, Kafka → Engine |
| Market Data | Candles, orderbook snapshots | Kafka consumer | WS → clients |

**Rules:**
- Engine hot path stays single-threaded and deterministic — no gRPC calls inside it
- Risk Engine should be stateless (reads positions from Redis/DB, owns no state)
- One `packages/proto` shared across all services (TS + Rust via prost)
- gRPC only at Risk→Engine boundary; everything post-trade stays Kafka

**Rust tooling for gRPC when ready:** `tonic` + `tonic-build` (codegen from .proto in build.rs)

---

## 17. Scaling Roadmap (Post-MVP, All Deferred)

| Concern | Solution |
|---------|---------|
| DB connection limits | PgBouncer (connection pooler) |
| Read throughput | PostgreSQL read replicas |
| Large tables | Partition `ledger_entries` + `trades` by time |
| Market data time-series | TimescaleDB (DONE — hypertables, aggregates, compression, retention) |
| Horizontal scale | Sharding by market |
| Redis WS fan-out | Redis Pub/Sub (DONE — ws.redis-bridge + ws-gateway psubscribe) |
| Kafka reliability | DLQ + retry strategy (deferred post-MVP) |

---

## 18. Known Peer Dependency Warning

```
packages/solana: utf-8-validate peer dependency warning
Decision: Safe to ignore.
```
