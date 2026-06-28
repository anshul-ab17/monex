-- Enable TimescaleDB extension (run as superuser)
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert Candle table to hypertable partitioned by openTime
-- Only run after TimescaleDB extension is installed
-- SELECT create_hypertable('"Candle"', 'openTime', migrate_data => true, if_not_exists => true);

-- Continuous aggregate for 1-hour candles from 1-minute
-- CREATE MATERIALIZED VIEW candle_1h
-- WITH (timescaledb.continuous) AS
-- SELECT
--   "marketId",
--   time_bucket('1 hour', "openTime") AS bucket,
--   first("open", "openTime") AS open,
--   max("high") AS high,
--   min("low") AS low,
--   last("close", "openTime") AS close,
--   sum("volume") AS volume
-- FROM "Candle"
-- WHERE interval = 'M1'
-- GROUP BY "marketId", bucket;

-- Note: Uncomment above when TimescaleDB is installed on your Postgres instance.
-- Standard Postgres works fine without it; TimescaleDB adds:
-- 1. Automatic time-based partitioning (faster range queries)
-- 2. Continuous aggregates (auto-rollup M1 → H1 → D1)
-- 3. Data retention policies (auto-drop old candles)
