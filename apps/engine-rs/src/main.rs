use monex_engine::matching::MatchingEngine;

#[tokio::main]
async fn main() {
    println!("Monex Engine v2 (Rust)");
    let _engine = MatchingEngine::new();
    // ponytail: Kafka consumer (rdkafka) wired when cmake available
    println!("Engine ready — awaiting Kafka integration");
    tokio::signal::ctrl_c().await.ok();
}
