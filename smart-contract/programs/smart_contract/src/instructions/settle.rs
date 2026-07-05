use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::ExchangeError;
use crate::state::*;

/// Reserve (order placement) / release (cancel): move funds between the
/// available and locked buckets of one Balance. settle_authority only.
#[derive(Accounts)]
pub struct BalanceMutation<'info> {
    #[account(seeds = [EXCHANGE_SEED], bump = exchange.bump, has_one = settle_authority)]
    pub exchange: Account<'info, Exchange>,
    pub settle_authority: Signer<'info>,
    #[account(mut)]
    pub balance: Account<'info, Balance>,
}

pub fn lock(ctx: Context<BalanceMutation>, amount: u64) -> Result<()> {
    require!(amount > 0, ExchangeError::InvalidAmount);
    let b = &mut ctx.accounts.balance;
    require!(b.available >= amount, ExchangeError::InsufficientAvailable);
    b.available = b.available.checked_sub(amount).ok_or(ExchangeError::MathOverflow)?;
    b.locked = b.locked.checked_add(amount).ok_or(ExchangeError::MathOverflow)?;
    Ok(())
}

pub fn unlock(ctx: Context<BalanceMutation>, amount: u64) -> Result<()> {
    require!(amount > 0, ExchangeError::InvalidAmount);
    let b = &mut ctx.accounts.balance;
    require!(b.locked >= amount, ExchangeError::InsufficientLocked);
    b.locked = b.locked.checked_sub(amount).ok_or(ExchangeError::MathOverflow)?;
    b.available = b.available.checked_add(amount).ok_or(ExchangeError::MathOverflow)?;
    Ok(())
}

/// Trade settlement primitive: move `amount` of one mint from `from` to
/// `to.available`. settle_authority only. Compose a full matched trade off-chain
/// as N settle_transfer instructions in one atomic transaction (base leg, quote
/// leg, maker fee, taker fee).
// ponytail: one-leg primitive; a dedicated settle_trade(base,quote,fees) instruction
// can replace it if per-trade atomicity in a single ix ever matters.
#[derive(Accounts)]
pub struct SettleTransfer<'info> {
    #[account(seeds = [EXCHANGE_SEED], bump = exchange.bump, has_one = settle_authority)]
    pub exchange: Account<'info, Exchange>,
    pub settle_authority: Signer<'info>,
    #[account(mut, constraint = from.key() != to.key())]
    pub from: Account<'info, Balance>,
    #[account(mut, constraint = from.mint == to.mint @ ExchangeError::MintMismatch)]
    pub to: Account<'info, Balance>,
}

pub fn settle_transfer(ctx: Context<SettleTransfer>, amount: u64, from_locked: bool) -> Result<()> {
    require!(amount > 0, ExchangeError::InvalidAmount);

    let from = &mut ctx.accounts.from;
    if from_locked {
        require!(from.locked >= amount, ExchangeError::InsufficientLocked);
        from.locked = from.locked.checked_sub(amount).ok_or(ExchangeError::MathOverflow)?;
    } else {
        require!(from.available >= amount, ExchangeError::InsufficientAvailable);
        from.available = from.available.checked_sub(amount).ok_or(ExchangeError::MathOverflow)?;
    }

    let to = &mut ctx.accounts.to;
    to.available = to.available.checked_add(amount).ok_or(ExchangeError::MathOverflow)?;
    Ok(())
}
