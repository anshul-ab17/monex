import Decimal from "decimal.js";
import type { OrderNode } from "./order-node";

export class PriceLevel {
    readonly price: bigint;
    head: OrderNode | null = null;
    tail: OrderNode | null = null;
    orderCount: number = 0;
    totalQty: Decimal = new Decimal(0);

    constructor(price: bigint) {
        this.price = price;
    }

    append(node: OrderNode): void {
        node.prev = this.tail;
        node.next = null;
        if (this.tail) {
            this.tail.next = node;
        } else {
            this.head = node;
        }
        this.tail = node;
        node.priceLevel = this;
        this.orderCount++;
        this.totalQty = this.totalQty.add(node.remainingQty);
    }

    remove(node: OrderNode): void {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }
        this.orderCount--;
        this.totalQty = this.totalQty.sub(node.remainingQty);
        node.prev = null;
        node.next = null;
        node.priceLevel = null;
    }

    isEmpty(): boolean {
        return this.orderCount === 0;
    }
}
