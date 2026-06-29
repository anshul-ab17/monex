# Monex — Bugs & Suggestions

> Last updated: 2026-06-30
> [BUG] confirmed bug · [WARN] potential issue · [DEBT] tech debt · [IDEA] improvement

---

## Active Bugs & Warnings

### [BUG] 161 Prisma TS errors — PrismaPg adapter typing
- **Where:** All files importing `db` from `@repo/db`
- **Observed:** Prisma 7 + PrismaPg adapter generates `PrismaClient<never, ...>` — TS can't see model properties (`db.trade`, `db.order`, etc.)
- **Impact:** TS errors (TS2339) across all services. Runtime works fine.
- **Fix:** Awaiting Prisma team fix for PrismaPg adapter type generation. Can suppress with `skipLibCheck` but loses safety.

---

### [BUG] Consumer disconnect not fully safe
- **Where:** `packages/kafka/src/consumer.ts`
- **Risk:** Zombie Kafka consumer group members → rebalance delays on restart
- **Fix:** Add `isConnected` guard; ensure disconnect is called once and awaited

---

### [WARN] No idempotency on auth consumer
- **Where:** `apps/server/src/consumers/auth.consumer.ts`
- **Observed:** Kafka at-least-once delivery. `auth.consumer.ts` will call `initUserAccounts` again on duplicate event.
- **Risk:** Duplicate LedgerAccount/Balance rows if USER_REGISTERED replayed
- **Fix:** Use `createMany` with `skipDuplicates: true` in `initUserAccounts`, or write `eventId` to EventStore first.

---

### [WARN] auth.consumer.ts implicit `any` type
- **Where:** `apps/server/src/consumers/auth.consumer.ts:19`
- **Error:** `Parameter 'a' implicitly has an 'any' type` (TS7006)
- **Fix:** Add explicit type annotation to `.find()` callback parameter

---

### [WARN] candle.service.ts possible undefined
- **Where:** `apps/server/src/services/market/candle.service.ts:18,35`
- **Error:** `Object is possibly 'undefined'` (TS2532)
- **Fix:** Add null checks or non-null assertions after market lookup

---

### [WARN] prediction.service.ts implicit `any`
- **Where:** `apps/server/src/services/market/prediction.service.ts:92`
- **Error:** `Parameter 'o' implicitly has an 'any' type` (TS7006)
- **Fix:** Add explicit type to `.find()` callback

---

### [WARN] SOLANA_MASTER_SECRET stored as plain env var
- **Where:** `.env` / `.example.env`
- **Risk:** Key exposure via logs, env dumps, CI artifacts
- **Fix (prod):** Use secrets manager (AWS Secrets Manager, Doppler, Vault)

---

### [WARN] Float must never be used for monetary values
- **Where:** Any TypeScript arithmetic on amounts
- **Rule:** All monetary fields use `Decimal @db.Decimal(30,10)`. All arithmetic uses `decimal.js`. Never `number` for amounts.

---

### [DEBT] No reconnect/catchup mechanism for WebSocket
- **Where:** `apps/server/src/ws/ws.routes.ts`, `apps/ws-gateway/src/index.ts`
- **Risk:** Clients miss events during disconnect — no sequence numbers, no snapshot-on-subscribe
- **Fix:** Add sequence numbers to Redis pub/sub messages, deliver snapshot on subscribe, track client last-seen sequence

---

### [DEBT] Market order matching not implemented in engine
- **Where:** `apps/engine/v2/src/matching/engine.rs`
- **Observed:** MARKET order type parsed but engine treats it as LIMIT at best price
- **Fix:** Implement aggressive sweep at any price (no price check) for MARKET orders

---

### [DEBT] Balance reconciliation job missing
- **Where:** Balance model vs LedgerEntry
- **Risk:** If a `$transaction` partially fails, Balance and LedgerEntry can diverge
- **Fix:** Add periodic reconciliation job that recomputes Balance from LedgerEntry aggregates

---

### [DEBT] ws-gateway subscriber uses both `subscribe` (per-channel) and `psubscribe` (user:*)
- **Where:** `apps/ws-gateway/src/subscriber.ts`
- **Observed:** Market channels use per-channel subscribe, user channels use pattern subscribe. Works but two subscription modes.
- **Risk:** Low — just complexity. If all channels used psubscribe, code would be simpler.

---

### [DEBT] nginx `limit_req_zone` inside server block
- **Where:** `infra/nginx/nginx.conf`
- **Observed:** `limit_req_zone` directives are inside `server {}` block — nginx requires them in `http {}` context
- **Fix:** Move `limit_req_zone` lines to `http {}` block (above `server {}`)

---

## Ideas & Suggestions

### [IDEA] Idempotency via EventStore
- `EventStore` model exists — use `eventId` as unique key before processing
- Required for at-least-once Kafka delivery safety across all consumers

### [IDEA] Correlation IDs / distributed tracing
- `registerCorrelationId()` exists in server — extend to Kafka headers + consumer logs
- Trace full request → Kafka → engine → consumer chain

### [IDEA] Redpanda Console in docker-compose
- Add `redpandadata/console` for local Kafka topic inspection

### [IDEA] Type-safe Kafka event publishing
- Enforce `producer.publish(topic, event)` accepts only the event type for that topic

### [IDEA] DLQ (Dead Letter Queue) for Kafka
- Route events that fail after N retries to DLQ topic. Required for production reliability.

### [IDEA] PgBouncer for connection pooling

### [IDEA] PostgreSQL read replicas

### [IDEA] Horizontal WS scaling via Redis Pub/Sub fan-out

### [IDEA] Blockchain watcher for auto-deposit detection
- Currently user submits txHash manually. Auto-detect with Solana websocket subscription.

### [IDEA] Zod-to-JSON-Schema for richer OpenAPI request/response docs
- Currently route schemas are hand-written JSON Schema for swagger. Could auto-generate from existing Zod schemas.

### [IDEA] Risk Engine as separate Rust service with tonic (gRPC)
- When pre-trade risk checks needed before order enters matching engine
- Stack: tonic + prost + tonic-build
- Topology: OMS → Risk Engine (gRPC) → Matching Engine

### [IDEA] ADL (Auto-Deleveraging) for perpetuals
- When liquidation fails to close at mark price, auto-deleverage against top-profitable positions

---

## Resolved

| Date | Issue | Resolution |
|------|-------|-----------|
| 2026-06-30 | `@repo/ledger` package disconnected from server | Types imported into journal.service + ledger.service |
| 2026-06-30 | 8 empty stub files cluttering codebase | Deleted: trade.consumer, error/rate-limit middleware, publishers, etc. |
| 2026-06-30 | No WS bridge between Redis pub/sub and broadcaster | Created ws.redis-bridge.ts with psubscribe |
| 2026-06-30 | No user-specific WS channel (order fills, liquidations) | Added user-events.service + auth in ws.routes |
| 2026-06-30 | `validation`/`solana` not under `@repo/*` namespace | Renamed to `@repo/validation`, `@repo/solana` everywhere |
| 2026-06-30 | ws-gateway used `new redis()` (instance not constructor) | Fixed to use exported `Redis` class from `@repo/redis` |
| 2026-06-30 | ws-gateway tsconfig referenced missing `bun-types` | Removed from types array |
| 2026-06-30 | Co-Authored-By Claude trailers in git history | Stripped via git filter-branch |
| 2026-06-30 | No API docs | Added OpenAPI (@fastify/swagger) + AsyncAPI YAML |
| 2026-06-29 | Protobuf outbound not implemented in engine | Rust prost encode + Envelope wrapping done |
| 2026-06-29 | No oracle integration | Pyth Hermes REST service with Redis cache |
| 2026-06-29 | No margin/liquidation system | Isolated margin + 10s liquidation job |
| 2026-06-29 | No prediction auto-resolution | Oracle-based auto-resolution job (30s) |
| 2026-06-29 | No TimescaleDB | Migration with hypertables, aggregates, compression |
| 2026-06-27 | Redis keys bug — all used `nonce:` prefix | Fixed in `packages/redis/src/keys.ts` |
| 2026-06-27 | No auth middleware on protected routes | `authenticate` wired to all protected routes |
| 2026-06-27 | Nonce not deleted on failed sig verify | `deleteNonce()` called before any return |
| 2026-06-27 | Empty service layer (Phase 1–3) | All services implemented |
| 2026-06-27 | No Prisma seed script | `packages/db/prisma/seed.ts` added |
| 2026-06-27 | fastify.d.ts wrong Redis/Kafka types | Fixed |
