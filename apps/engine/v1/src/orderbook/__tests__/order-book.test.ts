import { describe, test, expect } from "bun:test";
import Decimal from "decimal.js";
import { OrderBookPair, type BookOrder } from "../order-book";

function makeOrder(overrides: Partial<BookOrder> & { orderId: string; side: "BUY" | "SELL"; price: string; remainingQty: string }): BookOrder {
    return {
        userId: "u1",
        marketId: "SOL-USDC",
        sequenceNumber: 1n,
        timeInForce: "GTC",
        postOnly: false,
        ...overrides,
        price: new Decimal(overrides.price),
        remainingQty: new Decimal(overrides.remainingQty),
    };
}

let seq = 0n;
function nextSeq(): bigint {
    return ++seq;
}

describe("OrderBookPair", () => {
    test("add and wouldMatch — empty book returns false", () => {
        const book = new OrderBookPair("SOL-USDC");
        const order = makeOrder({ orderId: "o1", side: "BUY", price: "100", remainingQty: "10", sequenceNumber: nextSeq() });
        expect(book.wouldMatch(order)).toBe(false);
    });

    test("add bid then matching sell — wouldMatch returns true", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "o1", side: "BUY", price: "100", remainingQty: "10", sequenceNumber: nextSeq() }));
        const sell = makeOrder({ orderId: "o2", side: "SELL", price: "100", remainingQty: "5", sequenceNumber: nextSeq() });
        expect(book.wouldMatch(sell)).toBe(true);
    });

    test("match full fill", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "maker1", side: "SELL", price: "100", remainingQty: "10", sequenceNumber: nextSeq(), userId: "seller" }));
        const buyer = makeOrder({ orderId: "taker1", side: "BUY", price: "100", remainingQty: "10", sequenceNumber: nextSeq(), userId: "buyer" });
        const matches = book.match(buyer);
        expect(matches.length).toBe(1);
        expect(matches[0]!.makerOrderId).toBe("maker1");
        expect(matches[0]!.quantity.eq(new Decimal("10"))).toBe(true);
        expect(matches[0]!.price.eq(new Decimal("100"))).toBe(true);
    });

    test("match partial fill — multiple makers at different prices", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "ask1", side: "SELL", price: "99", remainingQty: "5", sequenceNumber: nextSeq(), userId: "s1" }));
        book.add(makeOrder({ orderId: "ask2", side: "SELL", price: "100", remainingQty: "5", sequenceNumber: nextSeq(), userId: "s2" }));
        book.add(makeOrder({ orderId: "ask3", side: "SELL", price: "101", remainingQty: "5", sequenceNumber: nextSeq(), userId: "s3" }));

        const buyer = makeOrder({ orderId: "buy1", side: "BUY", price: "100", remainingQty: "8", sequenceNumber: nextSeq() });
        const matches = book.match(buyer);
        expect(matches.length).toBe(2);
        expect(matches[0]!.makerOrderId).toBe("ask1");
        expect(matches[0]!.quantity.eq(new Decimal("5"))).toBe(true);
        expect(matches[1]!.makerOrderId).toBe("ask2");
        expect(matches[1]!.quantity.eq(new Decimal("3"))).toBe(true);
    });

    test("match no fill — price doesn't cross", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "ask1", side: "SELL", price: "101", remainingQty: "10", sequenceNumber: nextSeq() }));
        const buyer = makeOrder({ orderId: "buy1", side: "BUY", price: "100", remainingQty: "10", sequenceNumber: nextSeq() });
        const matches = book.match(buyer);
        expect(matches.length).toBe(0);
    });

    test("applyMatches removes filled maker, updates partial", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "ask1", side: "SELL", price: "100", remainingQty: "10", sequenceNumber: nextSeq(), userId: "s1" }));

        const buyer = makeOrder({ orderId: "buy1", side: "BUY", price: "100", remainingQty: "7", sequenceNumber: nextSeq() });
        const matches = book.match(buyer);
        book.applyMatches(matches, "BUY");

        // ask1 should still be in book with remainingQty 3
        const sellOrder = makeOrder({ orderId: "buy2", side: "SELL", price: "99", remainingQty: "100", sequenceNumber: nextSeq() });
        // no bids, so no match from sell side
        expect(book.match(sellOrder).length).toBe(0);

        // add a bid and match against remaining ask
        const buyer2 = makeOrder({ orderId: "buy3", side: "BUY", price: "100", remainingQty: "100", sequenceNumber: nextSeq() });
        const matches2 = book.match(buyer2);
        expect(matches2.length).toBe(1);
        expect(matches2[0]!.quantity.eq(new Decimal("3"))).toBe(true);
    });

    test("remove cancels order", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "o1", side: "BUY", price: "100", remainingQty: "10", sequenceNumber: nextSeq() }));
        book.remove("o1", "BUY");
        const sell = makeOrder({ orderId: "o2", side: "SELL", price: "100", remainingQty: "10", sequenceNumber: nextSeq() });
        expect(book.wouldMatch(sell)).toBe(false);
    });

    test("remove non-existent order is no-op", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.remove("nonexistent", "BUY");
    });

    test("FIFO order at same price", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "first", side: "SELL", price: "100", remainingQty: "5", sequenceNumber: nextSeq(), userId: "s1" }));
        book.add(makeOrder({ orderId: "second", side: "SELL", price: "100", remainingQty: "5", sequenceNumber: nextSeq(), userId: "s2" }));

        const buyer = makeOrder({ orderId: "buy1", side: "BUY", price: "100", remainingQty: "3", sequenceNumber: nextSeq() });
        const matches = book.match(buyer);
        expect(matches.length).toBe(1);
        expect(matches[0]!.makerOrderId).toBe("first");
    });

    test("bids match in descending price order", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "bid1", side: "BUY", price: "99", remainingQty: "5", sequenceNumber: nextSeq(), userId: "b1" }));
        book.add(makeOrder({ orderId: "bid2", side: "BUY", price: "101", remainingQty: "5", sequenceNumber: nextSeq(), userId: "b2" }));
        book.add(makeOrder({ orderId: "bid3", side: "BUY", price: "100", remainingQty: "5", sequenceNumber: nextSeq(), userId: "b3" }));

        const seller = makeOrder({ orderId: "sell1", side: "SELL", price: "99", remainingQty: "8", sequenceNumber: nextSeq() });
        const matches = book.match(seller);
        expect(matches.length).toBe(2);
        expect(matches[0]!.makerOrderId).toBe("bid2");
        expect(matches[0]!.price.eq(new Decimal("101"))).toBe(true);
        expect(matches[1]!.makerOrderId).toBe("bid3");
        expect(matches[1]!.quantity.eq(new Decimal("3"))).toBe(true);
    });

    test("lazy cleanup skips empty price levels during match", () => {
        const book = new OrderBookPair("SOL-USDC");
        book.add(makeOrder({ orderId: "ask1", side: "SELL", price: "100", remainingQty: "5", sequenceNumber: nextSeq() }));
        book.add(makeOrder({ orderId: "ask2", side: "SELL", price: "101", remainingQty: "5", sequenceNumber: nextSeq() }));
        book.remove("ask1", "SELL");

        const buyer = makeOrder({ orderId: "buy1", side: "BUY", price: "101", remainingQty: "5", sequenceNumber: nextSeq() });
        const matches = book.match(buyer);
        expect(matches.length).toBe(1);
        expect(matches[0]!.makerOrderId).toBe("ask2");
    });
});
