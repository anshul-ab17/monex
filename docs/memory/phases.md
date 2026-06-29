# Monex — Development Phases

> Last updated: 2026-06-30
> Track completion in [score.md](./score.md)
> Architecture reference: [systemdesign.md](./systemdesign.md)

---

## Phase 0 — Foundation (DONE)
> Infrastructure, monorepo, shared packages, database schema

### Monorepo & Tooling
- [x] Turborepo + pnpm workspaces
- [x] TypeScript + ESLint + Prettier config
- [x] Docker Compose — PostgreSQL 17, Redis 8, Redpanda v25.1.2

### Database (Prisma 7)
- [x] 18+ models across 6 domains (auth, trading, financial, ledger, market-data, margin)
- [x] All monetary fields: `Decimal @db.Decimal(30,10)` — never Float
- [x] Multi-file schema: `packages/db/prisma/models/*.prisma`
- [x] Migrations: init, ledger, prediction resolution, MarginAccount, TimescaleDB
- [x] Seed script: SOL, USDC, USDT assets + SOL/USDC, SOL/USDT spot markets

### Prisma Models

| Domain | Models |
|--------|--------|
| Auth | `User`, `Session`, `AuditLog` |
| Trading | `Market`, `Asset`, `Order`, `Trade`, `Position`, `OrderEvent` |
| Financial | `Balance`, `BalanceSnapshot`, `Deposit`, `Withdrawal` |
| Ledger | `LedgerAccount`, `LedgerJournal`, `LedgerEntry`, `EventStore` |
| Market Data | `Candle` (M1–D1 intervals) |
| Prediction | `Outcome` |
| Margin | `MarginAccount` |

### Packages

| Package | Status | Responsibility |
|---------|--------|---------------|
| `packages/config` | DONE | Zod env validation, `USE_KAFKA` flag |
| `packages/types` | DONE | JWT payloads, enums, WS payloads, DTOs |
| `packages/validation` | DONE | Zod schemas: auth, order, user, wallet, asset, market, prediction |
| `packages/events` | DONE | Typed Kafka event contracts |
| `packages/redis` | DONE | Client, Redis constructor export, nonce, session, cache |
| `packages/kafka` | DONE | Generic `publish<T>()` / `subscribe<T>()`, proto fallback |
| `packages/solana` | 70% | verifySignature, getTransaction, parseTokenTransfer, sendSol/sendToken |
| `packages/ledger` | DONE | Type exports (SettleTradeInput, ReserveInput, ReleaseInput, TransferInput) + credit/debit fns |
| `packages/db` | DONE | Prisma client, all models, seed.ts |
| `packages/proto` | DONE | `.proto` schemas + protobufjs TS bindings + Rust prost structs |

---

## Phase 1 — Ledger Service (DONE)
> Double-entry accounting — sole financial writer

- [x] `credit`, `debit`, `reserve`, `release`, `settleTrade`, `initUserAccounts`
- [x] `journal.service.ts` — journal creation + @repo/ledger type imports
- [x] `ledger.repository.ts` — account lookup/creation
- [x] All ops atomic via Prisma `$transaction`

---

## Phase 2 — Auth Service (DONE)
> Wallet-based Solana login, sessions, JWT

- [x] `GET /auth/nonce` — generate nonce, Redis (5 min TTL)
- [x] `POST /auth/wallet` — verify Solana signature, issue JWT
- [x] `POST /auth/refresh` — rotate access token
- [x] `POST /auth/logout` — invalidate session
- [x] Auth middleware on all protected routes
- [x] Auth consumer: USER_REGISTERED → initUserAccounts

---

## Phase 3 — Assets & Markets (DONE)
> Seed data + market data endpoints

- [x] Asset + Market CRUD
- [x] `depth.service` — order book depth + Redis orderbook cache (5s TTL)
- [x] `ticker.service` — 24h stats, Redis cached, pub/sub
- [x] `candle.service` — OHLCV M1–D1 aggregation
- [x] `funding.service` — 8h funding rate, prefers oracle mark price

---

## Phase 4 — Orders (DONE)
> Order placement, management, cancellation, risk checks

- [x] `orderService.create()` — validate → risk check → reserve → INSERT → publish
- [x] `orderService.cancel()` — release locked → CANCELLED
- [x] Risk service: max order value, open orders limit, position limit, balance check
- [x] Order consumer: ACCEPTED/REJECTED/FILLED/CANCELLED + user event notifications
- [x] Order publisher: ORDER_CREATED → Kafka

---

## Phase 5 — Deposits & Withdrawals (DONE)
> On-chain deposit detection, withdrawal flow

- [x] Deposit: submit txHash → parse → validate → credit ledger
- [x] Deposit poller job for pending deposits
- [x] Withdrawal: sig-verified, 24h cooldown, $10k daily limit
- [x] Withdrawal consumer: send on-chain tx, credit back on failure
- [x] Wallet consumer: DEPOSIT_CONFIRMED → credit

---

## Phase 6 — Matching Engine v2 (DONE — Rust core)
> `apps/engine/v2` — Rust, tokio, rdkafka, prost

- [x] Price-time FIFO order book (BTreeMap + VecDeque)
- [x] Stop order support (trigger on price crossing)
- [x] IOC/FOK enforcement
- [x] postOnly rejection
- [x] Multi-level matching (sweep across price levels)
- [x] rdkafka consumer (JSON ORDER_CREATED)
- [x] Kafka producer — prost Envelope encoding for TRADE_EXECUTED + ORDER_* events
- [x] Engine monitoring (health/status via Axum)
- [x] Benchmark suite (Criterion)
- [x] Fee calculation (maker/taker per trade)
- [x] Engine state recovery — server replays OPEN orders on startup
- [ ] Market order matching (aggressive sweep, no price check)

---

## Phase 7 — Trade Settlement (DONE)
> Post-match balance settlement, trade records

- [x] Trade consumer: Kafka → proto decode → idempotent insert → settle → candle → ticker
- [x] User event notifications on trade (order fills to buyer + seller)
- [x] Redis pub/sub: candle + trade tape messages
- [x] API: `GET /trades`, `GET /markets/:id/trades`

---

## Phase 8 — Withdrawals (DONE)
> Already covered in Phase 5

---

## Phase 9 — WebSocket Gateway (DONE)
> Real-time market data and user updates

### Fastify WS (`apps/server/src/ws/`)
- [x] `ws.routes.ts` — public channels (trades, depth, ticker, candle, orderbook) + authenticated user channels
- [x] `ws.redis-bridge.ts` — Redis psubscribe → wsBroadcaster relay
- [x] `ws.broadcaster.ts` — per-channel subscriber sets
- [x] JWT auth event for user-specific channels with ownership check
- [x] Ping/pong keepalive

### WS Gateway (`apps/ws-gateway/`)
- [x] Protobuf binary wire format (protobufjs)
- [x] Format negotiation (client chooses binary or JSON)
- [x] Connection management with per-client format tracking
- [x] Redis subscriber (subscribe per-channel + psubscribe user:*)
- [x] Orderbook channel support
- [x] Heartbeat (30s ping/pong)
- [ ] Reconnect / catchup mechanism (sequence numbers, snapshot on subscribe)

---

## Phase 10 — Protobuf & Wire Format (DONE)
> Shared proto definitions, TS + Rust bindings

### `packages/proto/monex.proto`
- OrderCreated, TradeExecuted (with taker_side, market_id), OrderEvent
- DepthLevel, DepthSnapshot, TickerUpdate, Candle
- Envelope (version, event_type, timestamp, payload bytes)

### Bindings
- **TypeScript:** `encode`, `decode`, `encodeEnvelope`, `decodeEnvelope` (protobufjs)
- **Rust:** Manual prost structs in `proto.rs` + `encode_envelope()` helper
- **Kafka fallback:** Consumer passes `{ __raw: Buffer }` when JSON parse fails, server consumers proto-decode

---

## Phase 11 — Kafka Event System (DONE)
> Typed event contracts + consumer/producer infrastructure

### Consumers

| Consumer | Topic | Events |
|----------|-------|--------|
| auth.consumer | auth | USER_REGISTERED → initUserAccounts |
| order.consumer | orders | ACCEPTED/REJECTED/FILLED/CANCELLED + user events |
| trade.consumer | trades | TRADE_EXECUTED → settle + candle + ticker + user events |
| wallet.consumer | wallets | DEPOSIT_CONFIRMED → credit |
| withdrawal.consumer | wallets | WITHDRAWAL_REQUESTED → on-chain tx |

---

## Phase 12 — Risk Engine (FUTURE — gRPC with tonic + prost)
> Synchronous pre-trade risk checks as separate Rust service

### Current State
In-process `RiskService` in TypeScript:
- Max order value: 100,000
- Max open orders per market: 100
- Max position size: 1,000,000
- Balance sufficiency check

### Future: Separate Rust service
- tonic gRPC server + client
- Stateless — reads positions from Redis
- Topology: OMS → Risk Engine (gRPC) → Matching Engine

---

## Phase 13 — Perpetual Futures (PARTIALLY DONE)
> Leverage trading with positions and liquidations

### Done
- [x] Position tracking: updateFromTrade, closePosition
- [x] Funding rate: 8h settlement, oracle mark price preferred
- [x] Oracle: Pyth Hermes REST, SOL/BTC/ETH feeds, 5s Redis cache
- [x] Isolated margin: per-position margin accounts, 1-20x leverage
- [x] Liquidation engine: 10s interval, force-close underwater positions, seize margin
- [x] Liquidation user notifications via Redis pub/sub
- [x] MarginAccount Prisma model

### Remaining
- [ ] `reduceOnly` order enforcement
- [ ] Leverage tiers (configurable per market)
- [ ] ADL (Auto-Deleveraging) when liquidation can't fill
- [ ] PnL realization improvements

---

## Phase 14 — Prediction Markets (DONE)
> Binary / multi-outcome market resolution

- [x] Create prediction market with N outcome sub-markets
- [x] Trading on outcome shares (reuses existing order engine)
- [x] Manual resolution + payout via ledgerService.credit()
- [x] Oracle auto-resolution (30s job, Pyth price, PREDICT-*-ABOVE/BELOW-* pattern)
- [x] Public list + detail endpoints

---

## Phase 15 — Hardening & Production (PARTIALLY DONE)
> Security, observability, performance

### Done
- [x] Rate limiting — `@fastify/rate-limit` 100 req/min
- [x] Withdrawal 24h cooldown + $10k daily limit
- [x] Audit log — Prisma middleware for financial mutations
- [x] CORS lockdown (FRONTEND_URL only)
- [x] Auth middleware on all protected routes
- [x] Metrics — prom-client at `GET /metrics`
- [x] Health check — `GET /health` (PG, Redis, Kafka)
- [x] Correlation IDs — `registerCorrelationId()` wired
- [x] OpenAPI — `@fastify/swagger` + swagger-ui at `/docs`
- [x] AsyncAPI — `asyncapi.yaml` documenting WS + Kafka
- [x] Nginx reverse proxy — rate limiting, WS upgrade, security headers
- [x] TimescaleDB — hypertables, continuous aggregates, compression, retention

### Remaining
- [ ] Distributed tracing across server → Kafka → engine → consumer
- [ ] PgBouncer connection pooling
- [ ] PostgreSQL read replicas
- [ ] Kafka DLQ + retry strategy
- [ ] Load testing
- [ ] Solana mainnet config

---

## Appendix A — Port Map

| Service | Port | Protocol |
|---------|------|----------|
| apps/server | 3001 | HTTP |
| apps/ws-gateway | 3002 | WebSocket |
| apps/engine/v2 | 3003 | HTTP (health/status) |
| apps/risk (future) | 50051 | gRPC |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Redpanda | 9092 (Kafka), 8082 (HTTP), 9644 (admin) |
| Nginx | 80/443 | HTTP/HTTPS |

---

## Appendix B — Kafka Topics

| Topic | Events | Producer | Consumer |
|-------|--------|----------|----------|
| auth | USER_REGISTERED, USER_LOGGED_IN | server | auth.consumer |
| orders | ORDER_CREATED, *_ACCEPTED, *_REJECTED, *_FILLED, *_CANCELLED | server, engine | order.consumer |
| trades | TRADE_EXECUTED | engine (prost) | trade.consumer |
| wallets | DEPOSIT_CONFIRMED, WITHDRAWAL_REQUESTED/COMPLETED/FAILED | server | wallet/withdrawal.consumer |
