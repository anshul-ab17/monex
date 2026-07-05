use anchor_lang::prelude::*;

use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeExchange<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Exchange::INIT_SPACE,
        seeds = [EXCHANGE_SEED],
        bump
    )]
    pub exchange: Account<'info, Exchange>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_exchange(
    ctx: Context<InitializeExchange>,
    settle_authority: Pubkey,
    fee_authority: Pubkey,
) -> Result<()> {
    let e = &mut ctx.accounts.exchange;
    e.authority = ctx.accounts.authority.key();
    e.settle_authority = settle_authority;
    e.fee_authority = fee_authority;
    e.paused = false;
    e.asset_count = 0;
    e.market_count = 0;
    e.bump = ctx.bumps.exchange;
    Ok(())
}

/// Admin-gated mutation of the Exchange config.
#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(mut, seeds = [EXCHANGE_SEED], bump = exchange.bump, has_one = authority)]
    pub exchange: Account<'info, Exchange>,
    pub authority: Signer<'info>,
}

pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
    ctx.accounts.exchange.paused = paused;
    Ok(())
}

pub fn set_settle_authority(ctx: Context<AdminOnly>, new_authority: Pubkey) -> Result<()> {
    ctx.accounts.exchange.settle_authority = new_authority;
    Ok(())
}

pub fn set_fee_authority(ctx: Context<AdminOnly>, new_authority: Pubkey) -> Result<()> {
    ctx.accounts.exchange.fee_authority = new_authority;
    Ok(())
}
