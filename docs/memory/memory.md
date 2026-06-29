# Monex — Project Memory Index

> Living index of all project knowledge. Update this file whenever a new doc is added.

| File | Purpose |
|------|---------|
| [systemdesign.md](./systemdesign.md) | Architecture, data flow, component responsibilities, wire format decisions, future gRPC topology |
| [phases.md](./phases.md) | Development roadmap broken into phases with milestones |
| [score.md](./score.md) | Completion tracker — feature-by-feature progress score |
| [bugs_or_suggestions.md](./bugs_or_suggestions.md) | Known bugs, tech-debt notes, improvement ideas |

---

## Project in One Paragraph

**Monex** is a decentralised crypto trading platform on **Solana**. It supports spot trading, prediction markets, and perpetual futures (isolated margin + liquidation). The backend is a Bun + Fastify monorepo with PostgreSQL (+ TimescaleDB) for persistence, Redis for sessions/cache/pub-sub, and Redpanda (Kafka-compatible) for event streaming. A double-entry ledger package enforces financial correctness. The matching engine (`apps/engine/v2`) is in Rust (tokio + rdkafka + prost) with protobuf outbound encoding. The WebSocket gateway (`apps/ws-gateway`) supports protobuf binary wire format with user-authenticated channels. Pyth oracle integration for mark prices. OpenAPI docs at `/docs`, AsyncAPI spec for WS/Kafka. Nginx reverse proxy configured. Auth is wallet-based (sign a nonce, verify signature on-chain).

---

## Stack Snapshot

| Layer | Technology |
|-------|-----------|
| Runtime | Bun 1.3.9 |
| HTTP | Fastify 5.x |
| ORM | Prisma 7 / PostgreSQL 17 |
| Cache | Redis 8 / ioredis |
| Events | Redpanda (Kafka) / KafkaJS |
| Blockchain | Solana Web3.js + SPL Token |
| Frontend | Next.js 16 / React 19 |
| Monorepo | Turborepo + pnpm workspaces |
| Validation | Zod 4 |
| Matching Engine | Rust / tokio / rdkafka / prost |
| WS Wire Format | Protobuf binary (prost in Rust, protobufjs in TS) |
| Future gRPC | tonic (Rust) — for Risk Engine → Matching Engine sync RPC |

---

## Key Contacts / Ownership

- Developer: Anshul Bharat (anshul.ab17x@gmail.com)
- Started: ~early 2026
- Status: **Active development** — 92% complete; next: Anchor contracts, Risk Engine gRPC
