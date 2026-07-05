use anchor_lang::prelude::*;

/// Global singleton config. PDA: [EXCHANGE_SEED].
/// Also the SPL authority of every asset vault token account.
#[account]
#[derive(InitSpace)]
pub struct Exchange {
    /// Admin: lists assets/markets, pauses, rotates authorities.
    pub authority: Pubkey,
    /// Off-chain matching engine / OMS: allowed to lock/unlock/settle balances.
    pub settle_authority: Pubkey,
    /// Receives trading fees (as a normal user Balance).
    pub fee_authority: Pubkey,
    pub paused: bool,
    pub asset_count: u64,
    pub market_count: u64,
    pub bump: u8,
}

/// A listed SPL mint. PDA: [ASSET_SEED, mint].
#[account]
#[derive(InitSpace)]
pub struct Asset {
    pub mint: Pubkey,
    pub decimals: u8,
    #[max_len(12)]
    pub symbol: String,
    pub enabled: bool,
    /// Bump of the vault token account PDA: [VAULT_SEED, mint].
    pub vault_bump: u8,
    pub bump: u8,
}

/// A tradable market. PDA: [MARKET_SEED, market_id].
#[account]
#[derive(InitSpace)]
pub struct Market {
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    /// 0 = spot, 1 = perp, 2 = prediction.
    pub kind: u8,
    pub enabled: bool,
    #[max_len(32)]
    pub market_id: String,
    pub bump: u8,
}

/// Per-user per-asset internal ledger. PDA: [BALANCE_SEED, owner, mint].
/// Funds physically live in the shared vault; this tracks who owns what.
#[account]
#[derive(InitSpace)]
pub struct Balance {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub available: u64,
    pub locked: u64,
    pub bump: u8,
}
