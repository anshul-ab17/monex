use std::collections::HashMap;
use crate::orderbook::{OrderBook, BookOrder, Side};
use super::fees::{FeeSchedule, FeeResult, calculate_fees};

#[derive(Debug, Clone)]
pub struct TradeOutput {
    pub trade_id: String,
    pub maker_order_id: String,
    pub maker_user_id: String,
    pub taker_order_id: String,
    pub taker_user_id: String,
    pub price: rust_decimal::Decimal,
    pub quantity: rust_decimal::Decimal,
    pub taker_side: Side,
    pub fees: FeeResult,
}

pub enum OrderResult {
    Accepted,
    Rejected { reason: String },
    Filled { trades: Vec<TradeOutput> },
    PartiallyFilled { trades: Vec<TradeOutput>, remaining: rust_decimal::Decimal },
}

pub struct MatchingEngine {
    books: HashMap<String, OrderBook>,
    fee_schedules: HashMap<String, FeeSchedule>,
}

impl MatchingEngine {
    pub fn new() -> Self {
        Self {
            books: HashMap::new(),
            fee_schedules: HashMap::new(),
        }
    }

    pub fn register_market(&mut self, market_id: &str, schedule: FeeSchedule) {
        self.books.entry(market_id.to_string()).or_insert_with(OrderBook::new);
        self.fee_schedules.insert(market_id.to_string(), schedule);
    }

    pub fn process_order(&mut self, order: BookOrder) -> OrderResult {
        let book = self.books.entry(order.market_id.clone()).or_insert_with(OrderBook::new);
        let schedule = self.fee_schedules.get(&order.market_id);

        if order.post_only && book.would_match(&order) {
            return OrderResult::Rejected {
                reason: "post-only order would cross".to_string(),
            };
        }

        let matches = book.match_order(&order);

        if matches.is_empty() {
            if order.time_in_force == "IOC" || order.time_in_force == "FOK" {
                return OrderResult::Rejected {
                    reason: "no liquidity for IOC/FOK".to_string(),
                };
            }
            book.add(&order);
            return OrderResult::Accepted;
        }

        let default_schedule = FeeSchedule {
            maker_fee: rust_decimal::Decimal::ZERO,
            taker_fee: rust_decimal::Decimal::ZERO,
        };
        let sched = schedule.unwrap_or(&default_schedule);

        let mut trades = Vec::with_capacity(matches.len());
        let mut filled_qty = rust_decimal::Decimal::ZERO;

        for m in &matches {
            let fees = calculate_fees(m.price, m.quantity, sched);
            filled_qty += m.quantity;

            trades.push(TradeOutput {
                trade_id: uuid::Uuid::new_v4().to_string(),
                maker_order_id: m.maker_order_id.clone(),
                maker_user_id: m.maker_user_id.clone(),
                taker_order_id: order.order_id.clone(),
                taker_user_id: order.user_id.clone(),
                price: m.price,
                quantity: m.quantity,
                taker_side: order.side,
                fees,
            });
        }

        let remaining = order.remaining_qty - filled_qty;

        if remaining.is_zero() {
            OrderResult::Filled { trades }
        } else if order.time_in_force == "GTC" {
            let mut rest = order.clone();
            rest.remaining_qty = remaining;
            book.add(&rest);
            OrderResult::PartiallyFilled { trades, remaining }
        } else {
            OrderResult::Filled { trades }
        }
    }

    pub fn cancel_order(&mut self, market_id: &str, order_id: &str, side: Side, price: rust_decimal::Decimal) -> bool {
        if let Some(book) = self.books.get_mut(market_id) {
            book.cancel(order_id, side, price)
        } else {
            false
        }
    }

    pub fn depth(&self, market_id: &str, levels: usize) -> Option<(Vec<(rust_decimal::Decimal, rust_decimal::Decimal)>, Vec<(rust_decimal::Decimal, rust_decimal::Decimal)>)> {
        self.books.get(market_id).map(|b| b.depth(levels))
    }
}

impl Default for MatchingEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    fn setup() -> MatchingEngine {
        let mut engine = MatchingEngine::new();
        engine.register_market("SOL-USDC", FeeSchedule {
            maker_fee: dec!(0.001),
            taker_fee: dec!(0.002),
        });
        engine
    }

    fn limit_order(id: &str, side: Side, price: rust_decimal::Decimal, qty: rust_decimal::Decimal) -> BookOrder {
        BookOrder {
            order_id: id.to_string(),
            user_id: "u1".to_string(),
            market_id: "SOL-USDC".to_string(),
            side,
            price,
            remaining_qty: qty,
            sequence_number: 1,
            time_in_force: "GTC".to_string(),
            post_only: false,
        }
    }

    #[test]
    fn test_accept_no_match() {
        let mut engine = setup();
        let result = engine.process_order(limit_order("b1", Side::Buy, dec!(100), dec!(5)));
        assert!(matches!(result, OrderResult::Accepted));
    }

    #[test]
    fn test_full_fill() {
        let mut engine = setup();
        engine.process_order(limit_order("b1", Side::Buy, dec!(100), dec!(5)));
        let result = engine.process_order(limit_order("s1", Side::Sell, dec!(100), dec!(5)));
        match result {
            OrderResult::Filled { trades } => {
                assert_eq!(trades.len(), 1);
                assert_eq!(trades[0].quantity, dec!(5));
                assert_eq!(trades[0].fees.maker_fee, dec!(0.5));
                assert_eq!(trades[0].fees.taker_fee, dec!(1));
            }
            _ => panic!("expected Filled"),
        }
    }

    #[test]
    fn test_post_only_reject() {
        let mut engine = setup();
        engine.process_order(limit_order("b1", Side::Buy, dec!(100), dec!(5)));
        let mut sell = limit_order("s1", Side::Sell, dec!(100), dec!(5));
        sell.post_only = true;
        let result = engine.process_order(sell);
        assert!(matches!(result, OrderResult::Rejected { .. }));
    }
}
