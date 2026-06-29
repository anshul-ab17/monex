use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use std::time::Duration;
use tracing::{error, info};

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
        let payload = serde_json::json!({
            "eventType": "ORDER_ACCEPTED",
            "payload": { "orderId": order_id, "marketId": market_id }
        });
        self.send(&self.orders_topic.clone(), order_id, &payload).await;
    }

    pub async fn publish_order_rejected(&self, order_id: &str, market_id: &str, reason: &str) {
        let payload = serde_json::json!({
            "eventType": "ORDER_REJECTED",
            "payload": { "orderId": order_id, "marketId": market_id, "reason": reason }
        });
        self.send(&self.orders_topic.clone(), order_id, &payload).await;
    }

    pub async fn publish_order_filled(&self, order_id: &str, market_id: &str) {
        let payload = serde_json::json!({
            "eventType": "ORDER_FILLED",
            "payload": { "orderId": order_id, "marketId": market_id }
        });
        self.send(&self.orders_topic.clone(), order_id, &payload).await;
    }

    pub async fn publish_order_partially_filled(
        &self,
        order_id: &str,
        market_id: &str,
        remaining_qty: &str,
    ) {
        let payload = serde_json::json!({
            "eventType": "ORDER_PARTIALLY_FILLED",
            "payload": { "orderId": order_id, "marketId": market_id, "remainingQty": remaining_qty }
        });
        self.send(&self.orders_topic.clone(), order_id, &payload).await;
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
        let payload = serde_json::json!({
            "eventType": "TRADE_EXECUTED",
            "payload": {
                "tradeId": trade_id,
                "buyOrderId": buy_order_id,
                "sellOrderId": sell_order_id,
                "buyerId": buyer_id,
                "sellerId": seller_id,
                "marketId": market_id,
                "price": price,
                "quantity": quantity,
                "makerFee": maker_fee,
                "takerFee": taker_fee,
                "takerSide": taker_side
            }
        });
        self.send(&self.trades_topic.clone(), trade_id, &payload).await;
    }

    async fn send(&self, topic: &str, key: &str, payload: &serde_json::Value) {
        let body = payload.to_string();
        let record = FutureRecord::to(topic).key(key).payload(&body);
        match self.inner.send(record, Duration::from_secs(5)).await {
            Ok(_) => info!("Published to {}: {}", topic, key),
            Err((e, _)) => error!("Failed to publish to {}: {}", topic, e),
        }
    }
}
