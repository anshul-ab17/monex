use anchor_lang::prelude::*;

#[error_code]
pub enum ExchangeError {
    #[msg("Exchange is paused")]
    ExchangePaused,
    #[msg("Asset is disabled")]
    AssetDisabled,
    #[msg("Market is disabled")]
    MarketDisabled,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Insufficient available balance")]
    InsufficientAvailable,
    #[msg("Insufficient locked balance")]
    InsufficientLocked,
    #[msg("Mint mismatch between balances")]
    MintMismatch,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Symbol too long")]
    SymbolTooLong,
    #[msg("Market id too long")]
    MarketIdTooLong,
}
