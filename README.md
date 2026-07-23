# Reishi

Reishi is a production-grade dex: prediction market and exchange infrastructure built with TypeScript, designed for scalability, reliability, and financial correctness.

Built on an event-driven architecture, Reishi leverages Fastify, PostgreSQL, Redis, Redpanda (Kafka), and Solana to power high-performance trading and real-time market data.

## Features

* High-performance order processing
* Price-time priority matching engine
* Double-entry accounting ledger
* Solana wallet authentication
* Real-time market data via WebSockets
* Event-driven architecture with Kafka
* Modular monorepo architecture using Turborepo

## Tech Stack

**Backend:** Fastify, TypeScript, Bun
**Frontend:** Next.js
**Database:** PostgreSQL, Prisma ORM
**Messaging:** Redpanda (Kafka)
**Cache:** Redis
**Blockchain:** Solana
**Infrastructure:** Docker, Docker Compose, Turborepo

## Prerequisites

* Node.js >= 22
* pnpm >= 10
* Docker & Docker Compose

## Installation

```bash
# Clone the repository
git clone https://github.com/anshul-ab17/reishi.git

# Move into the project directory
cd reishi

# Install dependencies
pnpm install
```

## Environment Setup

```bash
cp .env.example .env
```

Update the `.env` file with the required configuration values.

## Start Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and Redpanda locally.

## Run Database Migrations

```bash
pnpm db:migrate
```

## Start Development

```bash
pnpm dev
```

## Repository Structure

```text
apps/                  # Deployable applications
packages/              # Shared libraries and domain modules

apps/
├── server             # Fastify HTTP API server
├── web                # Next.js frontend application
├── engine             # Order matching engine
└── ws-gateway         # Real-time WebSocket gateway

packages/
├── db                 # Prisma schema and database client
├── redis              # Redis client and caching utilities
├── kafka              # Kafka producer and consumer abstractions
├── events             # Typed event contracts
├── ledger             # Double-entry accounting system
├── solana             # Solana blockchain integration
├── config             # Environment configuration and validation
├── types              # Shared TypeScript types
└── validation         # Zod validation schemas
```

## Architecture

Reishi follows an event-driven architecture where PostgreSQL acts as the source of truth, Redis manages ephemeral state and caching, and Redpanda (Kafka) enables asynchronous communication between services.

## System design

![Reishi System Design](./system-design/reishi-architecture.svg)