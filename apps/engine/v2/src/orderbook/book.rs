use std::collections::BTreeMap;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use super::price_level::{OrderEntry, PriceLevel};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Side {
    Buy,
    Sell,
}

#[derive(Debug, Clone)]
pub struct BookOrder {
    pub order_id: String,
    pub user_id: String,
    pub market_id: String,
    pub side: Side,
    pub price: Decimal,
    pub remaining_qty: Decimal,
    pub sequence_number: u64,
    pub time_in_force: String,
    pub post_only: bool,
    pub stop_price: Option<Decimal>,
    pub order_type: String,
}

#[derive(Debug, Clone)]
pub struct MatchResult {
    pub maker_order_id: String,
    pub maker_user_id: String,
    pub price: Decimal,
    pub quantity: Decimal,
    pub maker_remaining_before: Decimal,
}

pub struct OrderBook {
    bids: BTreeMap<Decimal, PriceLevel>,
    asks: BTreeMap<Decimal, PriceLevel>,
}

impl OrderBook {
    pub fn new() -> Self {
        Self {
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
        }
    }

    pub fn add(&mut self, order: &BookOrder) {
        let side_map = match order.side {
            Side::Buy => &mut self.bids,
            Side::Sell => &mut self.asks,
        };
        let level = side_map.entry(order.price).or_insert_with(|| PriceLevel::new(order.price));
        level.add(OrderEntry {
            order_id: order.order_id.clone(),
            user_id: order.user_id.clone(),
            remaining_qty: order.remaining_qty,
            sequence_number: order.sequence_number,
        });
    }

    pub fn cancel(&mut self, order_id: &str, side: Side, price: Decimal) -> bool {
        let side_map = match side {
            Side::Buy => &mut self.bids,
            Side::Sell => &mut self.asks,
        };
        if let Some(level) = side_map.get_mut(&price) {
            let removed = level.cancel_order(order_id);
            if level.is_empty() {
                side_map.remove(&price);
            }
            removed
        } else {
            false
        }
    }

    pub fn would_match(&self, order: &BookOrder) -> bool {
        match order.side {
            Side::Buy => {
                if let Some((&best_ask, _)) = self.asks.iter().next() {
                    order.price >= best_ask
                } else {
                    false
                }
            }
            Side::Sell => {
                if let Some((&best_bid, _)) = self.bids.iter().next_back() {
                    order.price <= best_bid
                } else {
                    false
                }
            }
        }
    }

    pub fn match_order(&mut self, order: &BookOrder) -> Vec<MatchResult> {
        let is_market = order.order_type == "MARKET";
        let mut matches = Vec::new();
        let mut remaining = order.remaining_qty;

        match order.side {
            Side::Buy => {
                let mut exhausted_prices = Vec::new();
                for (&ask_price, level) in self.asks.iter_mut() {
                    if remaining.is_zero() {
                        break;
                    }
                    if !is_market && order.price < ask_price {
                        break;
                    }
                    Self::match_against_level(level, &mut remaining, &mut matches);
                    if level.is_empty() {
                        exhausted_prices.push(ask_price);
                    }
                }
                for p in exhausted_prices {
                    self.asks.remove(&p);
                }
            }
            Side::Sell => {
                let mut exhausted_prices = Vec::new();
                for (&bid_price, level) in self.bids.iter_mut().rev() {
                    if remaining.is_zero() {
                        break;
                    }
                    if !is_market && order.price > bid_price {
                        break;
                    }
                    Self::match_against_level(level, &mut remaining, &mut matches);
                    if level.is_empty() {
                        exhausted_prices.push(bid_price);
                    }
                }
                for p in exhausted_prices {
                    self.bids.remove(&p);
                }
            }
        }

        matches
    }

    fn match_against_level(
        level: &mut PriceLevel,
        remaining: &mut Decimal,
        matches: &mut Vec<MatchResult>,
    ) {
        while !remaining.is_zero() && !level.is_empty() {
            let front = level.orders.front().unwrap();
            let maker_remaining = front.remaining_qty;
            let fill_qty = (*remaining).min(maker_remaining);

            matches.push(MatchResult {
                maker_order_id: front.order_id.clone(),
                maker_user_id: front.user_id.clone(),
                price: level.price,
                quantity: fill_qty,
                maker_remaining_before: maker_remaining,
            });

            *remaining -= fill_qty;

            if fill_qty >= maker_remaining {
                level.remove_front();
            } else {
                level.reduce_front(fill_qty);
            }
        }
    }

    pub fn best_bid(&self) -> Option<Decimal> {
        self.bids.keys().next_back().copied()
    }

    pub fn best_ask(&self) -> Option<Decimal> {
        self.asks.keys().next().copied()
    }

    pub fn spread(&self) -> Option<Decimal> {
        match (self.best_bid(), self.best_ask()) {
            (Some(bid), Some(ask)) => Some(ask - bid),
            _ => None,
        }
    }

    pub fn depth(&self, levels: usize) -> (Vec<(Decimal, Decimal)>, Vec<(Decimal, Decimal)>) {
        let bids: Vec<_> = self.bids.iter().rev().take(levels)
            .map(|(&p, l)| (p, l.total_qty)).collect();
        let asks: Vec<_> = self.asks.iter().take(levels)
            .map(|(&p, l)| (p, l.total_qty)).collect();
        (bids, asks)
    }
}

impl Default for OrderBook {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    fn make_order(id: &str, side: Side, price: Decimal, qty: Decimal, seq: u64) -> BookOrder {
        BookOrder {
            order_id: id.to_string(),
            user_id: "user1".to_string(),
            market_id: "SOL-USDC".to_string(),
            side,
            price,
            remaining_qty: qty,
            sequence_number: seq,
            time_in_force: "GTC".to_string(),
            post_only: false,
            stop_price: None,
            order_type: "LIMIT".to_string(),
        }
    }

    #[test]
    fn test_add_and_depth() {
        let mut book = OrderBook::new();
        book.add(&make_order("b1", Side::Buy, dec!(100), dec!(5), 1));
        book.add(&make_order("b2", Side::Buy, dec!(99), dec!(3), 2));
        book.add(&make_order("a1", Side::Sell, dec!(101), dec!(4), 3));

        assert_eq!(book.best_bid(), Some(dec!(100)));
        assert_eq!(book.best_ask(), Some(dec!(101)));
        assert_eq!(book.spread(), Some(dec!(1)));

        let (bids, asks) = book.depth(10);
        assert_eq!(bids.len(), 2);
        assert_eq!(asks.len(), 1);
    }

    #[test]
    fn test_full_match() {
        let mut book = OrderBook::new();
        book.add(&make_order("b1", Side::Buy, dec!(100), dec!(5), 1));

        let sell = make_order("s1", Side::Sell, dec!(100), dec!(5), 2);
        let matches = book.match_order(&sell);

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].quantity, dec!(5));
        assert_eq!(matches[0].maker_order_id, "b1");
        assert!(book.best_bid().is_none());
    }

    #[test]
    fn test_partial_match() {
        let mut book = OrderBook::new();
        book.add(&make_order("b1", Side::Buy, dec!(100), dec!(10), 1));

        let sell = make_order("s1", Side::Sell, dec!(100), dec!(3), 2);
        let matches = book.match_order(&sell);

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].quantity, dec!(3));
        assert_eq!(book.best_bid(), Some(dec!(100)));
    }

    #[test]
    fn test_multi_level_match() {
        let mut book = OrderBook::new();
        book.add(&make_order("b1", Side::Buy, dec!(100), dec!(2), 1));
        book.add(&make_order("b2", Side::Buy, dec!(99), dec!(3), 2));

        let sell = make_order("s1", Side::Sell, dec!(99), dec!(4), 3);
        let matches = book.match_order(&sell);

        assert_eq!(matches.len(), 2);
        assert_eq!(matches[0].quantity, dec!(2));
        assert_eq!(matches[0].price, dec!(100));
        assert_eq!(matches[1].quantity, dec!(2));
        assert_eq!(matches[1].price, dec!(99));
    }

    #[test]
    fn test_cancel() {
        let mut book = OrderBook::new();
        book.add(&make_order("b1", Side::Buy, dec!(100), dec!(5), 1));
        assert!(book.cancel("b1", Side::Buy, dec!(100)));
        assert!(book.best_bid().is_none());
    }

    #[test]
    fn test_would_match() {
        let mut book = OrderBook::new();
        book.add(&make_order("b1", Side::Buy, dec!(100), dec!(5), 1));

        let crossing = make_order("s1", Side::Sell, dec!(100), dec!(1), 2);
        assert!(book.would_match(&crossing));

        let non_crossing = make_order("s2", Side::Sell, dec!(101), dec!(1), 3);
        assert!(!book.would_match(&non_crossing));
    }
}
