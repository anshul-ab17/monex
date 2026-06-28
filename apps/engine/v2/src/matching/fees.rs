use rust_decimal::Decimal;

#[derive(Debug, Clone)]
pub struct FeeSchedule {
    pub maker_fee: Decimal,
    pub taker_fee: Decimal,
}

#[derive(Debug, Clone)]
pub struct FeeResult {
    pub maker_fee: Decimal,
    pub taker_fee: Decimal,
    pub total_fee: Decimal,
}

pub fn calculate_fees(price: Decimal, quantity: Decimal, schedule: &FeeSchedule) -> FeeResult {
    let notional = price * quantity;
    let maker_fee = notional * schedule.maker_fee;
    let taker_fee = notional * schedule.taker_fee;
    FeeResult {
        maker_fee,
        taker_fee,
        total_fee: maker_fee + taker_fee,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    #[test]
    fn test_fee_calculation() {
        let schedule = FeeSchedule {
            maker_fee: dec!(0.001),
            taker_fee: dec!(0.002),
        };
        let result = calculate_fees(dec!(100), dec!(10), &schedule);
        assert_eq!(result.maker_fee, dec!(1));
        assert_eq!(result.taker_fee, dec!(2));
        assert_eq!(result.total_fee, dec!(3));
    }
}
