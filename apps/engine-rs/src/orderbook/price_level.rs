use std::collections::VecDeque;
use rust_decimal::Decimal;

#[derive(Debug, Clone)]
pub struct OrderEntry {
    pub order_id: String,
    pub user_id: String,
    pub remaining_qty: Decimal,
    pub sequence_number: u64,
}

#[derive(Debug, Clone)]
pub struct PriceLevel {
    pub price: Decimal,
    pub orders: VecDeque<OrderEntry>,
    pub total_qty: Decimal,
}

impl PriceLevel {
    pub fn new(price: Decimal) -> Self {
        Self {
            price,
            orders: VecDeque::new(),
            total_qty: Decimal::ZERO,
        }
    }

    pub fn add(&mut self, entry: OrderEntry) {
        self.total_qty += entry.remaining_qty;
        self.orders.push_back(entry);
    }

    pub fn is_empty(&self) -> bool {
        self.orders.is_empty()
    }

    pub fn remove_front(&mut self) -> Option<OrderEntry> {
        if let Some(entry) = self.orders.pop_front() {
            self.total_qty -= entry.remaining_qty;
            Some(entry)
        } else {
            None
        }
    }

    pub fn reduce_front(&mut self, qty: Decimal) {
        if let Some(front) = self.orders.front_mut() {
            front.remaining_qty -= qty;
            self.total_qty -= qty;
        }
    }

    pub fn cancel_order(&mut self, order_id: &str) -> bool {
        if let Some(pos) = self.orders.iter().position(|o| o.order_id == order_id) {
            let entry = self.orders.remove(pos).unwrap();
            self.total_qty -= entry.remaining_qty;
            true
        } else {
            false
        }
    }
}
