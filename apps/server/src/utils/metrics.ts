import client from "prom-client";

// Use default registry with default process/GC metrics
const register = client.register;
client.collectDefaultMetrics({ register });

export const ordersPlaced = new client.Counter({
    name: "reishi_orders_placed_total",
    help: "Total number of orders placed",
    labelNames: ["market_id", "side", "type"],
    registers: [register],
});

export const tradesExecuted = new client.Counter({
    name: "reishi_trades_executed_total",
    help: "Total number of trades executed",
    labelNames: ["market_id"],
    registers: [register],
});

export const matchLatency = new client.Histogram({
    name: "reishi_match_latency_ms",
    help: "Order match latency in milliseconds",
    buckets: [1, 5, 10, 25, 50, 100, 250, 500],
    registers: [register],
});

export const wsConnections = new client.Gauge({
    name: "reishi_ws_connections_active",
    help: "Active WebSocket connections",
    registers: [register],
});

export const httpRequestDuration = new client.Histogram({
    name: "reishi_http_request_duration_ms",
    help: "HTTP request duration in milliseconds",
    labelNames: ["method", "route", "status"],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [register],
});

export { register };
