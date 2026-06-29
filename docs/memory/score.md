# Monex — Completion Score

> Last updated: 2026-06-30
> Scale: ░ = 0% · █ = 10%

---

## Progress Dashboard

```
MONEX PROJECT STATUS

Architecture         ██████████ 100%
Database Schema      ██████████ 100%
Ledger Design        ██████████ 100%
Kafka Architecture   █████████░  90%
Security Design      █████████░  90%

Config Package       ██████████ 100%
Types Package        ██████████ 100%
Validation Package   ██████████ 100%

Events Package       █████████░  85%
Redis Package        ██████████ 100%  ← Redis constructor exported
Kafka Package        █████████░  90%
Solana Package       ███████░░░  70%
Ledger Package       ██████████ 100%  ← types connected to server
Proto Package        █████████░  90%  ← protobuf binary + Rust prost encode done
DB Package           ██████████ 100%  ← MarginAccount model added

Backend Foundation   ██████████ 100%

Auth Service         █████████░  90%
Ledger Service       █████████░  90%
Asset Service        █████████░  90%
Market Service       █████████░  90%
Order Service        ██████████ 100%  ← create, list, getById, cancel + risk checks
Deposit Service      ██████████ 100%  ← submit, list, getById + deposit poller
Withdrawal Service   ██████████ 100%  ← request, list, getById + consumer
Trade Service        ██████████ 100%  ← user/market trade history
Portfolio Service    ██████████ 100%  ← portfolio + fee tiers
Position Service     █████████░  90%  ← updateFromTrade, closePosition
Oracle Service       ██████████ 100%  ← Pyth Hermes, Redis cached
Margin Service       ██████████ 100%  ← isolated margin, liquidation price calc
Liquidation Service  ██████████ 100%  ← 10s interval, force-close + user events
Prediction Service   █████████░  90%  ← create, resolve, oracle auto-resolution
Candle Service       █████████░  90%  ← OHLCV aggregation, all intervals
Ticker Service       ██████████ 100%  ← 24h stats, Redis pub/sub
Depth Service        ██████████ 100%  ← orderbook cache + Redis pub/sub
Funding Service      █████████░  90%  ← 8h funding rate, oracle mark price
User Events Service  ██████████ 100%  ← order/balance/position/liquidation pub/sub

Matching Engine v2   ████████░░  80%  ← Rust + Kafka producer + prost outbound
WS Gateway           █████████░  90%  ← proto wire format + user channels + orderbook
WS Routes (Fastify)  ██████████ 100%  ← Redis bridge, auth, candle/orderbook channels

API Docs             ██████████ 100%  ← OpenAPI swagger + AsyncAPI
Nginx                ██████████ 100%  ← reverse proxy config

Overall Progress
█████████░  92%
```

---

## Detailed Breakdown

### Design & Architecture

| Item | % | Notes |
|------|---|-------|
| System architecture | 100 | Finalized |
| Database schema | 100 | 18+ models, MarginAccount added |
| Ledger design | 100 | Double-entry, signed amounts |
| Kafka architecture | 90 | Topics + event contracts, DLQ deferred |
| Security design | 90 | Auth, rate limiting, audit log, withdrawal cooldown done |
| Wire format | 100 | Protobuf binary (prost→Kafka→protobufjs), JSON fallback |
| API documentation | 100 | OpenAPI (swagger-ui at /docs) + AsyncAPI |

---

### Packages (Infrastructure Layer)

| Package | % | Notes |
|---------|---|-------|
| `packages/config` | 100 | Done |
| `packages/types` | 100 | Done |
| `packages/validation` | 100 | Done — all schemas: auth, order, wallet, market, prediction |
| `packages/events` | 85 | Market events may need refinement |
| `packages/redis` | 100 | Client + Redis constructor export for subscriber instances |
| `packages/kafka` | 90 | Generic publish/subscribe + proto fallback; DLQ deferred |
| `packages/solana` | 70 | Core fns done; blockchain watcher deferred |
| `packages/ledger` | 100 | Type exports (SettleTradeInput, ReserveInput, etc.) connected to server |
| `packages/db` | 100 | Schema complete with MarginAccount; TimescaleDB migration added |
| `packages/proto` | 90 | Protobuf binary wire format + TS bindings + Rust prost encode done |

---

### Backend Services (`apps/server`)

| Service | % | Notes |
|---------|---|-------|
| LedgerService | 90 | credit, debit, reserve, release, settleTrade, initUserAccounts |
| AuthService | 90 | nonce, wallet login, refresh, logout, middleware |
| AssetService | 90 | list, getById |
| MarketService | 90 | list, getById, candles, depth, ticker, funding |
| OrderService | 100 | create (with risk), list, getById, cancel |
| DepositService | 100 | submitDeposit, getDeposits, getDepositById, deposit poller |
| WithdrawalService | 100 | requestWithdrawal (sig-verified, 24h cooldown, $10k limit) |
| TradeService | 100 | listByUser, listByMarket |
| PortfolioService | 100 | getPortfolio, getFeeTier, listFeeTiers |
| PositionService | 90 | updateFromTrade, closePosition |
| OracleService | 100 | Pyth Hermes REST, SOL/BTC/ETH feeds, 5s Redis cache |
| MarginService | 100 | openIsolatedMargin, addMargin, computeLiquidationPrice |
| LiquidationService | 100 | 10s interval, force-close, seize margin, cancel orders |
| PredictionService | 90 | create, resolve, oracle auto-resolution job |
| CandleService | 90 | OHLCV across M1-D1 intervals |
| TickerService | 100 | 24h stats, Redis pub/sub |
| DepthService | 100 | Orderbook depth + Redis cache pub/sub |
| FundingService | 90 | 8h funding rate, prefers oracle mark price |
| UserEventsService | 100 | order/balance/position/liquidation events via Redis |
| OrderbookCacheService | 100 | Redis snapshot cache (5s TTL) + pub/sub |

### Consumers

| Consumer | % | Notes |
|----------|---|-------|
| auth.consumer | 90 | USER_REGISTERED → initUserAccounts |
| order.consumer | 100 | ACCEPTED/REJECTED/FILLED + user event publish |
| trade.consumer | 100 | Settle, candle, ticker, trade tape, user events |
| wallet.consumer | 100 | DEPOSIT_CONFIRMED → credit ledger |
| withdrawal.consumer | 100 | WITHDRAWAL_REQUESTED → on-chain tx |

### Jobs

| Job | % | Notes |
|-----|---|-------|
| cleanup.job | 100 | Stale session/nonce cleanup |
| deposit-poller.job | 100 | Poll pending deposits |
| engine-recovery.job | 100 | Replay OPEN orders to engine |
| prediction-expiry.job | 100 | Auto-expire prediction markets |
| funding.job | 100 | 8h funding rate settlement |
| liquidation.job | 100 | 10s underwater position check |
| prediction-oracle.job | 100 | 30s Pyth price auto-resolution |

### WebSocket

| Component | % | Notes |
|-----------|---|-------|
| ws.routes (Fastify) | 100 | Auth, public+user channels, ping/pong, Redis bridge auto-start |
| ws.redis-bridge | 100 | psubscribe market:* + user:* → wsBroadcaster |
| ws.broadcaster | 100 | Per-channel subscriber sets |
| ws-gateway | 90 | Proto wire format, user psubscribe, orderbook; reconnect/catchup deferred |

### Infrastructure

| Component | % | Notes |
|-----------|---|-------|
| Docker Compose | 100 | PG + Redis + Redpanda |
| Nginx | 100 | Reverse proxy, rate limiting, WS upgrade, security headers |
| OpenAPI | 100 | @fastify/swagger + swagger-ui at /docs |
| AsyncAPI | 100 | WS channels + Kafka topics documented |
| TimescaleDB | 100 | Hypertables, continuous aggregates, compression, retention |

---

### Engine & Gateway

| Service | % | Notes |
|---------|---|-------|
| `apps/engine/v2` (Rust) | 80 | Kafka producer (prost encode), stop orders, monitoring; market order matching deferred |
| `apps/ws-gateway` | 90 | Proto wire format, user channels, orderbook; reconnect/catchup deferred |

---

### Not Yet Done

| Area | Status |
|------|--------|
| Market order matching (engine) | Deferred |
| Reconnect/catchup mechanism (WS) | Deferred |
| Risk Engine (gRPC, Rust) | Future — Phase 12 |
| Anchor/Solana contracts | Future |
| Blockchain watcher (auto-detect deposits) | Deferred |
| DLQ + Kafka retry strategy | Deferred |
| PgBouncer / read replicas | Deferred |

---

## Current Build Order

```
✅ Ledger Service
✅ Auth Service
✅ Asset + Market Service
✅ Order Service + Risk Checks
✅ Deposit + Withdrawal Services
✅ Matching Engine v2 (Rust core + Kafka producer)
✅ Trade Settlement (consumer + candle + ticker)
✅ WS Gateway (proto wire format)
✅ Prediction Markets (create, resolve, oracle auto)
✅ Oracle Service (Pyth Hermes)
✅ Margin + Liquidation
✅ WS Streaming (Redis bridge, user events, auth channels)
✅ TimescaleDB Migration
✅ OpenAPI + AsyncAPI docs
✅ Nginx reverse proxy
      ↓
→ Anchor/Solana Contracts
→ Risk Engine (gRPC, Phase 12)
→ Perps (leverage, ADL)
```
