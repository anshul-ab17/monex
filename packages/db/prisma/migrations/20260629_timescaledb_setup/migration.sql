-- TimescaleDB setup: convert Candle and Trade tables to hypertables
-- Requires: CREATE EXTENSION IF NOT EXISTS timescaledb (run as superuser first)

-- Enable extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert Trade table to hypertable (partitioned by createdAt)
-- Note: Trade.id is UUID PK — TimescaleDB requires the partitioning column
-- in any unique index. We drop the PK constraint and add a composite one.
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_pkey";
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_pkey" PRIMARY KEY ("id", "createdAt");
SELECT create_hypertable('"Trade"', 'createdAt', migrate_data => true, if_not_exists => true);

-- Convert Candle table to hypertable (partitioned by openTime)
ALTER TABLE "Candle" DROP CONSTRAINT "Candle_pkey";
ALTER TABLE "Candle" ADD CONSTRAINT "Candle_pkey" PRIMARY KEY ("id", "openTime");
SELECT create_hypertable('"Candle"', 'openTime', migrate_data => true, if_not_exists => true);

-- Continuous aggregate for 1-hour candles from trades
CREATE MATERIALIZED VIEW IF NOT EXISTS trade_ohlcv_1h
WITH (timescaledb.continuous) AS
SELECT
  "marketId",
  time_bucket('1 hour', "createdAt") AS bucket,
  first("price", "createdAt") AS open,
  max("price") AS high,
  min("price") AS low,
  last("price", "createdAt") AS close,
  sum("quantity") AS volume,
  count(*) AS trade_count
FROM "Trade"
GROUP BY "marketId", bucket
WITH NO DATA;

-- Refresh policy: refresh 1h buckets every 10 minutes
SELECT add_continuous_aggregate_policy('trade_ohlcv_1h',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '10 minutes',
  if_not_exists => true
);

-- Compression policy: compress Trade data older than 7 days
ALTER TABLE "Trade" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = '"marketId"',
  timescaledb.compress_orderby = '"createdAt" DESC'
);
SELECT add_compression_policy('"Trade"', INTERVAL '7 days', if_not_exists => true);

-- Retention policy: drop raw candle data older than 90 days (aggregates survive)
SELECT add_retention_policy('"Candle"', INTERVAL '90 days', if_not_exists => true);
