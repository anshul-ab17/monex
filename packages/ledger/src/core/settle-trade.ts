export interface SettleTradeInput {
    tradeId: string;
    buyerId: string;
    sellerId: string;
    quantity: string;
    price: string;
    fee: string;
}

export async function settleTrade(
  input: SettleTradeInput,
) {
  return input;
}