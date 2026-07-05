pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("HQVFLU86z6vUQLgUpoaa1aW2DGPvvnw9PVfxpvcudYAF");

#[program]
pub mod smart_contract {
    use super::*;

    // ── Admin / config ──────────────────────────────────
    pub fn initialize_exchange(
        ctx: Context<InitializeExchange>,
        settle_authority: Pubkey,
        fee_authority: Pubkey,
    ) -> Result<()> {
        instructions::initialize_exchange(ctx, settle_authority, fee_authority)
    }

    pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
        instructions::set_paused(ctx, paused)
    }

    pub fn set_settle_authority(ctx: Context<AdminOnly>, new_authority: Pubkey) -> Result<()> {
        instructions::set_settle_authority(ctx, new_authority)
    }

    pub fn set_fee_authority(ctx: Context<AdminOnly>, new_authority: Pubkey) -> Result<()> {
        instructions::set_fee_authority(ctx, new_authority)
    }

    // ── Registry ────────────────────────────────────────
    pub fn list_asset(ctx: Context<ListAsset>, symbol: String) -> Result<()> {
        instructions::list_asset(ctx, symbol)
    }

    pub fn list_market(ctx: Context<ListMarket>, market_id: String, kind: u8) -> Result<()> {
        instructions::list_market(ctx, market_id, kind)
    }

    pub fn set_asset_enabled(ctx: Context<SetAssetEnabled>, enabled: bool) -> Result<()> {
        instructions::set_asset_enabled(ctx, enabled)
    }

    pub fn set_market_enabled(ctx: Context<SetMarketEnabled>, enabled: bool) -> Result<()> {
        instructions::set_market_enabled(ctx, enabled)
    }

    // ── Custody vaults ──────────────────────────────────
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw(ctx, amount)
    }

    // ── Settlement (settle_authority only) ──────────────
    pub fn lock(ctx: Context<BalanceMutation>, amount: u64) -> Result<()> {
        instructions::lock(ctx, amount)
    }

    pub fn unlock(ctx: Context<BalanceMutation>, amount: u64) -> Result<()> {
        instructions::unlock(ctx, amount)
    }

    pub fn settle_transfer(
        ctx: Context<SettleTransfer>,
        amount: u64,
        from_locked: bool,
    ) -> Result<()> {
        instructions::settle_transfer(ctx, amount, from_locked)
    }
}
