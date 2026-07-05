use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::ExchangeError;
use crate::state::*;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(seeds = [EXCHANGE_SEED], bump = exchange.bump)]
    pub exchange: Account<'info, Exchange>,
    #[account(
        seeds = [ASSET_SEED, mint.key().as_ref()],
        bump = asset.bump,
        constraint = asset.enabled @ ExchangeError::AssetDisabled
    )]
    pub asset: Account<'info, Asset>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [VAULT_SEED, mint.key().as_ref()], bump = asset.vault_bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token.mint == mint.key() @ ExchangeError::MintMismatch,
        constraint = user_token.owner == user.key()
    )]
    pub user_token: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Balance::INIT_SPACE,
        seeds = [BALANCE_SEED, user.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub balance: Account<'info, Balance>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, ExchangeError::InvalidAmount);
    require!(!ctx.accounts.exchange.paused, ExchangeError::ExchangePaused);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    let b = &mut ctx.accounts.balance;
    b.owner = ctx.accounts.user.key();
    b.mint = ctx.accounts.mint.key();
    b.bump = ctx.bumps.balance;
    b.available = b.available.checked_add(amount).ok_or(ExchangeError::MathOverflow)?;
    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(seeds = [EXCHANGE_SEED], bump = exchange.bump)]
    pub exchange: Account<'info, Exchange>,
    #[account(seeds = [ASSET_SEED, mint.key().as_ref()], bump = asset.bump)]
    pub asset: Account<'info, Asset>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [VAULT_SEED, mint.key().as_ref()], bump = asset.vault_bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_token.mint == mint.key() @ ExchangeError::MintMismatch,
        constraint = user_token.owner == user.key()
    )]
    pub user_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [BALANCE_SEED, user.key().as_ref(), mint.key().as_ref()],
        bump = balance.bump
    )]
    pub balance: Account<'info, Balance>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// Withdraw of own available funds is allowed even while the exchange is paused,
// so users can always exit. Only `available` (not `locked`) is withdrawable.
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, ExchangeError::InvalidAmount);

    let b = &mut ctx.accounts.balance;
    require!(b.available >= amount, ExchangeError::InsufficientAvailable);
    b.available = b.available.checked_sub(amount).ok_or(ExchangeError::MathOverflow)?;

    let bump = ctx.accounts.exchange.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[EXCHANGE_SEED, &[bump]]];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user_token.to_account_info(),
                authority: ctx.accounts.exchange.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;
    Ok(())
}
