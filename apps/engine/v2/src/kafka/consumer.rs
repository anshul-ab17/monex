use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::message::Message;
use tokio_stream::StreamExt;
use rdkafka::consumer::CommitMode;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error, warn};

use crate::matching::engine::MatchingEngine;
use crate::orderbook::{BookOrder, Side};

#[derive(serde::Deserialize)]
struct OrderPayload {
    #[serde(rename = "orderId")]
    order_id: String,
    #[serde(rename = "userId")]
    user_id: String,
    #[serde(rename = "marketId")]
    market_id: String,
    side: String,
    #[serde(rename = "type")]
    order_type: String,
    price: Option<String>,
    #[serde(rename = "stopPrice")]
    stop_price: Option<String>,
    quantity: String,
    #[serde(rename = "timeInForce")]
    time_in_force: Option<String>,
    #[serde(rename = "postOnly")]
    post_only: Option<bool>,
    #[serde(rename = "sequenceNumber")]
    sequence_number: Option<u64>,
}

#[derive(serde::Deserialize)]
struct EngineEvent {
    #[serde(rename = "eventType")]
    event_type: String,
    payload: serde_json::Value,
}

pub async fn run_consumer(
    brokers: &str,
    group_id: &str,
    topic: &str,
    engine: Arc<RwLock<MatchingEngine>>,
) {
    let consumer: StreamConsumer = ClientConfig::new()
        .set("group.id", group_id)
        .set("bootstrap.servers", brokers)
        .set("auto.offset.reset", "latest")
        .set("enable.auto.commit", "false")
        .create()
        .expect("Failed to create Kafka consumer");

    consumer.subscribe(&[topic]).expect("Failed to subscribe to topic");

    info!("Kafka consumer started on topic: {}", topic);

    let mut stream = consumer.stream();

    while let Some(result) = stream.next().await {
        match result {
            Ok(msg) => {
                if let Some(payload) = msg.payload() {
                    if let Err(e) = handle_message(payload, &engine).await {
                        error!("Failed to handle message: {}", e);
                    }
                }
                if let Err(e) = consumer.commit_message(&msg, CommitMode::Async) {
                    warn!("Failed to commit offset: {}", e);
                }
            }
            Err(e) => error!("Kafka error: {}", e),
        }
    }
}

async fn handle_message(
    payload: &[u8],
    engine: &Arc<RwLock<MatchingEngine>>,
) -> Result<(), Box<dyn std::error::Error>> {
    let event: EngineEvent = serde_json::from_slice(payload)?;

    if event.event_type != "ORDER_CREATED" {
        return Ok(());
    }

    let order_payload: OrderPayload = serde_json::from_value(event.payload)?;

    let side = match order_payload.side.as_str() {
        "BUY" => Side::Buy,
        "SELL" => Side::Sell,
        _ => return Err("invalid side".into()),
    };

    let price = order_payload.price
        .as_deref()
        .unwrap_or("0")
        .parse::<rust_decimal::Decimal>()?;

    let stop_price = order_payload.stop_price
        .as_deref()
        .map(|s| s.parse::<rust_decimal::Decimal>())
        .transpose()?;

    let book_order = BookOrder {
        order_id: order_payload.order_id,
        user_id: order_payload.user_id,
        market_id: order_payload.market_id,
        side,
        price,
        remaining_qty: order_payload.quantity.parse()?,
        sequence_number: order_payload.sequence_number.unwrap_or(0),
        time_in_force: order_payload.time_in_force.unwrap_or_else(|| "GTC".to_string()),
        post_only: order_payload.post_only.unwrap_or(false),
        stop_price,
        order_type: order_payload.order_type,
    };

    let mut eng = engine.write().await;
    let result = eng.process_order(book_order);

    match &result {
        crate::matching::engine::OrderResult::Accepted => {
            info!("Order accepted");
        }
        crate::matching::engine::OrderResult::StopAccepted => {
            info!("Stop order registered");
        }
        crate::matching::engine::OrderResult::Rejected { reason } => {
            warn!("Order rejected: {}", reason);
        }
        crate::matching::engine::OrderResult::Filled { trades } => {
            info!("Order filled with {} trades", trades.len());
        }
        crate::matching::engine::OrderResult::PartiallyFilled { trades, remaining } => {
            info!("Order partially filled: {} trades, {} remaining", trades.len(), remaining);
        }
    }

    Ok(())
}
