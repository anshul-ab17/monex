use criterion::{criterion_group, criterion_main, Criterion};
use monex_engine::orderbook::{OrderBook, BookOrder, Side};
use rust_decimal_macros::dec;

fn bench_insert_and_match(c: &mut Criterion) {
    c.bench_function("insert 10k orders", |b| {
        b.iter(|| {
            let mut book = OrderBook::new();
            for i in 0..10_000u64 {
                let price = rust_decimal::Decimal::from(100) + rust_decimal::Decimal::from(i % 100);
                book.add(&BookOrder {
                    order_id: format!("o{i}"),
                    user_id: "u1".to_string(),
                    market_id: "SOL-USDC".to_string(),
                    side: if i % 2 == 0 { Side::Buy } else { Side::Sell },
                    price,
                    remaining_qty: dec!(1),
                    sequence_number: i,
                    time_in_force: "GTC".to_string(),
                    post_only: false,
                    stop_price: None,
                    order_type: "LIMIT".to_string(),
                });
            }
        })
    });

    c.bench_function("match against 1k levels", |b| {
        let mut book = OrderBook::new();
        for i in 0..1_000u64 {
            book.add(&BookOrder {
                order_id: format!("b{i}"),
                user_id: "u1".to_string(),
                market_id: "SOL-USDC".to_string(),
                side: Side::Buy,
                price: rust_decimal::Decimal::from(100 + i),
                remaining_qty: dec!(10),
                sequence_number: i,
                time_in_force: "GTC".to_string(),
                post_only: false,
            });
        }
        b.iter(|| {
            let mut b2 = OrderBook::new();
            // Clone bids by re-adding (bench isolation)
            for i in 0..1_000u64 {
                b2.add(&BookOrder {
                    order_id: format!("b{i}"),
                    user_id: "u1".to_string(),
                    market_id: "SOL-USDC".to_string(),
                    side: Side::Buy,
                    price: rust_decimal::Decimal::from(100 + i),
                    remaining_qty: dec!(10),
                    sequence_number: i,
                    time_in_force: "GTC".to_string(),
                    post_only: false,
                    stop_price: None,
                    order_type: "LIMIT".to_string(),
                });
            }
            let sell = BookOrder {
                order_id: "s1".to_string(),
                user_id: "u2".to_string(),
                market_id: "SOL-USDC".to_string(),
                side: Side::Sell,
                price: rust_decimal::Decimal::from(100),
                remaining_qty: dec!(500),
                sequence_number: 9999,
                time_in_force: "GTC".to_string(),
                post_only: false,
                stop_price: None,
                order_type: "LIMIT".to_string(),
            };
            b2.match_order(&sell);
        })
    });
}

criterion_group!(benches, bench_insert_and_match);
criterion_main!(benches);
