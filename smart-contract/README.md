# Monex Smart Contract (Anchor)

On-chain layer for the Monex exchange: **asset/market registry + custody vaults + settlement ledger**. Matching stays off-chain (Rust engine); this program holds funds and records who owns what.

## Program: `smart_contract`

### Accounts (PDAs)
| Account | Seeds | Purpose |
|---------|-------|---------|
| `Exchange` | `["exchange"]` | Singleton config. Holds `authority` (admin), `settle_authority` (OMS), `fee_authority`, `paused`. Also the SPL authority of every vault. |
| `Asset` | `["asset", mint]` | A listed SPL mint. `decimals` copied from the mint, `enabled` flag. |
| vault (SPL token acct) | `["vault", mint]` | Shared custody token account per mint, owned by the `Exchange` PDA. |
| `Market` | `["market", market_id]` | base/quote mint + `kind` (0 spot, 1 perp, 2 predict). |
| `Balance` | `["balance", owner, mint]` | Per-user per-mint internal ledger: `available` + `locked`. |

### Instructions
- **Admin:** `initialize_exchange`, `set_paused`, `set_settle_authority`, `set_fee_authority`
- **Registry:** `list_asset`, `list_market`, `set_asset_enabled`, `set_market_enabled`
- **Custody:** `deposit` (user → vault, credits `available`), `withdraw` (debits `available`, vault → user; allowed even when paused)
- **Settlement** (`settle_authority` only): `lock` / `unlock` (available↔locked, order reserve/cancel), `settle_transfer(amount, from_locked)` — one-leg move used to compose a matched trade as N instructions in one atomic tx.

### Custody model
Funds physically sit in one vault token account per mint. `Balance` PDAs track ownership. A trade never moves tokens — it re-attributes `Balance` amounts via `settle_transfer`. Tokens only move on `deposit`/`withdraw`.

### Trust
- `authority` — lists assets/markets, pauses. Cannot take user funds.
- `settle_authority` — the off-chain OMS. Can lock/unlock/re-attribute balances (not withdraw to arbitrary wallets).
- Users — only `deposit` / `withdraw` their own funds.

## Scope / ceilings
- SPL Token (legacy) only. Token-2022 + native SOL (via wSOL) not wired yet.
- `settle_transfer` is a single-leg primitive; a bundled `settle_trade` ix can replace it if needed.

## Build / test
```bash
anchor build          # or: cargo build-sbf
anchor test           # cargo test (litesvm)
anchor deploy         # to the configured cluster
```
Program id: `HQVFLU86z6vUQLgUpoaa1aW2DGPvvnw9PVfxpvcudYAF` (localnet keypair; regenerate with `anchor keys sync` before mainnet).
