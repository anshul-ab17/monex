use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::error::ExchangeError;
use crate::state::*;

#[derive(Accounts)]
pub struct ListAsset<'info> {
    #[account(mut, seeds = [EXCHANGE_SEED], bump = exchange.bump, has_one = authority)]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        space = 8 + Asset::INIT_SPACE,
        seeds = [ASSET_SEED, mint.key().as_ref()],
        bump
    )]
    pub asset: Account<'info, Asset>,
    /// Shared custody vault for this mint. Authority is the Exchange PDA.
    #[account(
        init,
        payer = authority,
        seeds = [VAULT_SEED, mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = exchange
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn list_asset(ctx: Context<ListAsset>, symbol: String) -> Result<()> {
    require!(symbol.len() <= 12, ExchangeError::SymbolTooLong);
    let a = &mut ctx.accounts.asset;
    a.mint = ctx.accounts.mint.key();
    a.decimals = ctx.accounts.mint.decimals;
    a.symbol = symbol;
    a.enabled = true;
    a.vault_bump = ctx.bumps.vault;
    a.bump = ctx.bumps.asset;

    let e = &mut ctx.accounts.exchange;
    e.asset_count = e.asset_count.checked_add(1).ok_or(ExchangeError::MathOverflow)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(market_id: String)]
pub struct ListMarket<'info> {
    #[account(mut, seeds = [EXCHANGE_SEED], bump = exchange.bump, has_one = authority)]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(seeds = [ASSET_SEED, base_asset.mint.as_ref()], bump = base_asset.bump)]
    pub base_asset: Account<'info, Asset>,
    #[account(seeds = [ASSET_SEED, quote_asset.mint.as_ref()], bump = quote_asset.bump)]
    pub quote_asset: Account<'info, Asset>,
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [MARKET_SEED, market_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    pub system_program: Program<'info, System>,
}

pub fn list_market(ctx: Context<ListMarket>, market_id: String, kind: u8) -> Result<()> {
    require!(market_id.len() <= 32, ExchangeError::MarketIdTooLong);
    let m = &mut ctx.accounts.market;
    m.base_mint = ctx.accounts.base_asset.mint;
    m.quote_mint = ctx.accounts.quote_asset.mint;
    m.kind = kind;
    m.enabled = true;
    m.market_id = market_id;
    m.bump = ctx.bumps.market;

    let e = &mut ctx.accounts.exchange;
    e.market_count = e.market_count.checked_add(1).ok_or(ExchangeError::MathOverflow)?;
    Ok(())
}

#[derive(Accounts)]
pub struct SetAssetEnabled<'info> {
    #[account(seeds = [EXCHANGE_SEED], bump = exchange.bump, has_one = authority)]
    pub exchange: Account<'info, Exchange>,
    pub authority: Signer<'info>,
    #[account(mut, seeds = [ASSET_SEED, asset.mint.as_ref()], bump = asset.bump)]
    pub asset: Account<'info, Asset>,
}

pub fn set_asset_enabled(ctx: Context<SetAssetEnabled>, enabled: bool) -> Result<()> {
    ctx.accounts.asset.enabled = enabled;
    Ok(())
}

#[derive(Accounts)]
pub struct SetMarketEnabled<'info> {
    #[account(seeds = [EXCHANGE_SEED], bump = exchange.bump, has_one = authority)]
    pub exchange: Account<'info, Exchange>,
    pub authority: Signer<'info>,
    #[account(mut, seeds = [MARKET_SEED, market.market_id.as_bytes()], bump = market.bump)]
    pub market: Account<'info, Market>,
}

pub fn set_market_enabled(ctx: Context<SetMarketEnabled>, enabled: bool) -> Result<()> {
    ctx.accounts.market.enabled = enabled;
    Ok(())
}
