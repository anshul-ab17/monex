use std::sync::Arc;
use tokio::sync::RwLock;
use axum::{Router, routing::get, Json, extract::State};
use monex_engine::matching::MatchingEngine;
use monex_engine::kafka::consumer::run_consumer;

type SharedEngine = Arc<RwLock<MatchingEngine>>;

async fn health() -> &'static str {
    "ok"
}

async fn status(State(engine): State<SharedEngine>) -> Json<serde_json::Value> {
    let _eng = engine.read().await;
    Json(serde_json::json!({ "engine": "v2", "status": "running" }))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let engine = Arc::new(RwLock::new(MatchingEngine::new()));

    let brokers = std::env::var("KAFKA_BROKERS").unwrap_or_else(|_| "localhost:19092".to_string());
    let topic = std::env::var("KAFKA_ENGINE_TOPIC").unwrap_or_else(|_| "engine".to_string());

    let kafka_engine = engine.clone();
    tokio::spawn(async move {
        run_consumer(&brokers, "monex-engine-v2", &topic, kafka_engine).await;
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/status", get(status))
        .with_state(engine.clone());

    let port = std::env::var("ENGINE_PORT").unwrap_or_else(|_| "3003".to_string());
    let addr = format!("0.0.0.0:{port}");

    tracing::info!("Monex Engine v2 (Rust/Axum) on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
