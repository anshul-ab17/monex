use prost::Message;

#[derive(Clone, PartialEq, Message)]
pub struct TradeExecuted {
    #[prost(string, tag = "1")]
    pub trade_id: String,
    #[prost(string, tag = "2")]
    pub buy_order_id: String,
    #[prost(string, tag = "3")]
    pub sell_order_id: String,
    #[prost(string, tag = "4")]
    pub buyer_id: String,
    #[prost(string, tag = "5")]
    pub seller_id: String,
    #[prost(string, tag = "6")]
    pub quantity: String,
    #[prost(string, tag = "7")]
    pub price: String,
    #[prost(string, tag = "8")]
    pub maker_fee: String,
    #[prost(string, tag = "9")]
    pub taker_fee: String,
    #[prost(string, tag = "10")]
    pub taker_side: String,
    #[prost(string, tag = "11")]
    pub market_id: String,
}

#[derive(Clone, PartialEq, Message)]
pub struct OrderEvent {
    #[prost(string, tag = "1")]
    pub order_id: String,
    #[prost(string, tag = "2")]
    pub market_id: String,
    #[prost(string, tag = "3")]
    pub event_type: String,
    #[prost(string, tag = "4")]
    pub reason: String,
    #[prost(string, tag = "5")]
    pub remaining_qty: String,
}

#[derive(Clone, PartialEq, Message)]
pub struct Envelope {
    #[prost(uint32, tag = "1")]
    pub version: u32,
    #[prost(string, tag = "2")]
    pub event_type: String,
    #[prost(int64, tag = "3")]
    pub timestamp: i64,
    #[prost(bytes = "vec", tag = "4")]
    pub payload: Vec<u8>,
}

pub fn encode_envelope(event_type: &str, inner: &[u8]) -> Vec<u8> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;
    let envelope = Envelope {
        version: 1,
        event_type: event_type.to_string(),
        timestamp: now,
        payload: inner.to_vec(),
    };
    envelope.encode_to_vec()
}
