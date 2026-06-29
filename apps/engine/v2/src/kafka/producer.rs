use prost::Message;
use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use std::time::Duration;
use tracing::{error, info};

use crate::proto::{TradeExecuted, OrderEvent, encode_envelope};

pub struct KafkaProducer {
    inner: FutureProducer,
    orders_topic: String,
    trades_topic: String,
}

impl KafkaProducer {
    pub fn new(brokers: &str) -> Self {
        let inner: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("message.timeout.ms", "5000")
            .create()
            .expect("Failed to create Kafka producer");

        Self {
            inner,
            orders_topic: std::env::var("KAFKA_ORDERS_TOPIC").unwrap_or_else(|_| "orders".to_string()),
            trades_topic: std::env::var("KAFKA_TRADES_TOPIC").unwrap_or_else(|_| "trades".to_string()),
        }
    }

    pub async fn publish_order_accepted(&self, order_id: &str, market_id: &str) {
        let inner = OrderEvent {
            order_id: order_id.to_string(),
            market_id: market_id.to_string(),
            event_type: "ORDER_ACCEPTED".to_string(),
            reason: String::new(),
            remaining_qty: String::new(),
        };
        let bytes = encode_envelope("ORDER_ACCEPTED", &inner.encode_to_vec());
        self.send_bytes(&self.orders_topic.clone(), order_id, &bytes).await;
    }

    pub async fn publish_order_rejected(&self, order_id: &str, market_id: &str, reason: &str) {
        let inner = OrderEvent {
            order_id: order_id.to_string(),
            market_id: market_id.to_string(),
            event_type: "ORDER_REJECTED".to_string(),
            reason: reason.to_string(),
            remaining_qty: String::new(),
        };
        let bytes = encode_envelope("ORDER_REJECTED", &inner.encode_to_vec());
        self.send_bytes(&self.orders_topic.clone(), order_id, &bytes).await;
    }

    pub async fn publish_order_filled(&self, order_id: &str, market_id: &str) {
        let inner = OrderEvent {
            order_id: order_id.to_string(),
            market_id: market_id.to_string(),
            event_type: "ORDER_FILLED".to_string(),
            reason: String::new(),
            remaining_qty: String::new(),
        };
        let bytes = encode_envelope("ORDER_FILLED", &inner.encode_to_vec());
        self.send_bytes(&self.orders_topic.clone(), order_id, &bytes).await;
    }

    pub async fn publish_order_partially_filled(
        &self,
        order_id: &str,
        market_id: &str,
        remaining_qty: &str,
    ) {
        let inner = OrderEvent {
            order_id: order_id.to_string(),
            market_id: market_id.to_string(),
            event_type: "ORDER_PARTIALLY_FILLED".to_string(),
            reason: String::new(),
            remaining_qty: remaining_qty.to_string(),
        };
        let bytes = encode_envelope("ORDER_PARTIALLY_FILLED", &inner.encode_to_vec());
        self.send_bytes(&self.orders_topic.clone(), order_id, &bytes).await;
    }

    pub async fn publish_trade_executed(
        &self,
        trade_id: &str,
        buy_order_id: &str,
        sell_order_id: &str,
        buyer_id: &str,
        seller_id: &str,
        market_id: &str,
        price: &str,
        quantity: &str,
        maker_fee: &str,
        taker_fee: &str,
        taker_side: &str,
    ) {
        let inner = TradeExecuted {
            trade_id: trade_id.to_string(),
            buy_order_id: buy_order_id.to_string(),
            sell_order_id: sell_order_id.to_string(),
            buyer_id: buyer_id.to_string(),
            seller_id: seller_id.to_string(),
            market_id: market_id.to_string(),
            price: price.to_string(),
            quantity: quantity.to_string(),
            maker_fee: maker_fee.to_string(),
            taker_fee: taker_fee.to_string(),
            taker_side: taker_side.to_string(),
        };
        let bytes = encode_envelope("TRADE_EXECUTED", &inner.encode_to_vec());
        self.send_bytes(&self.trades_topic.clone(), trade_id, &bytes).await;
    }

    async fn send_bytes(&self, topic: &str, key: &str, payload: &[u8]) {
        let record = FutureRecord::to(topic).key(key).payload(payload);
        match self.inner.send(record, Duration::from_secs(5)).await {
            Ok(_) => info!("Published proto to {}: {}", topic, key),
            Err((e, _)) => error!("Failed to publish to {}: {}", topic, e),
        }
    }
}
