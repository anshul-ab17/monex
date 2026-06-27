import { describe, test, expect } from "bun:test";
import { BPlusTree } from "../bplus-tree";

describe("BPlusTree", () => {
    test("empty tree", () => {
        const tree = new BPlusTree<string>(4);
        expect(tree.size).toBe(0);
        expect(tree.min()).toBeNull();
        expect(tree.max()).toBeNull();
        expect(tree.get(1n)).toBeNull();
    });

    test("insert and get single entry", () => {
        const tree = new BPlusTree<string>(4);
        tree.insert(10n, "ten");
        expect(tree.size).toBe(1);
        expect(tree.get(10n)).toBe("ten");
        expect(tree.min()).toBe(10n);
        expect(tree.max()).toBe(10n);
    });

    test("insert multiple keys maintains order", () => {
        const tree = new BPlusTree<string>(4);
        tree.insert(30n, "thirty");
        tree.insert(10n, "ten");
        tree.insert(20n, "twenty");
        expect(tree.size).toBe(3);
        expect(tree.min()).toBe(10n);
        expect(tree.max()).toBe(30n);
        expect(tree.get(20n)).toBe("twenty");
    });

    test("insert triggers leaf split", () => {
        const tree = new BPlusTree<number>(4);
        for (let i = 1n; i <= 10n; i++) {
            tree.insert(i, Number(i));
        }
        expect(tree.size).toBe(10);
        for (let i = 1n; i <= 10n; i++) {
            expect(tree.get(i)).toBe(Number(i));
        }
        expect(tree.min()).toBe(1n);
        expect(tree.max()).toBe(10n);
    });

    test("delete single entry", () => {
        const tree = new BPlusTree<string>(4);
        tree.insert(10n, "ten");
        tree.delete(10n);
        expect(tree.size).toBe(0);
        expect(tree.get(10n)).toBeNull();
        expect(tree.min()).toBeNull();
    });

    test("delete non-existent key is no-op", () => {
        const tree = new BPlusTree<string>(4);
        tree.insert(10n, "ten");
        tree.delete(99n);
        expect(tree.size).toBe(1);
    });

    test("delete with merge/redistribution", () => {
        const tree = new BPlusTree<number>(4);
        for (let i = 1n; i <= 20n; i++) {
            tree.insert(i, Number(i));
        }
        for (let i = 1n; i <= 15n; i++) {
            tree.delete(i);
        }
        expect(tree.size).toBe(5);
        for (let i = 16n; i <= 20n; i++) {
            expect(tree.get(i)).toBe(Number(i));
        }
    });

    test("ascending leaf iteration via minLeaf", () => {
        const tree = new BPlusTree<number>(4);
        for (let i = 1n; i <= 20n; i++) {
            tree.insert(i, Number(i));
        }
        const keys: bigint[] = [];
        let leaf = tree.minLeaf();
        while (leaf) {
            keys.push(...leaf.keys);
            leaf = leaf.next;
        }
        expect(keys).toEqual(Array.from({ length: 20 }, (_, i) => BigInt(i + 1)));
    });

    test("descending leaf iteration via maxLeaf", () => {
        const tree = new BPlusTree<number>(4);
        for (let i = 1n; i <= 20n; i++) {
            tree.insert(i, Number(i));
        }
        const keys: bigint[] = [];
        let leaf = tree.maxLeaf();
        while (leaf) {
            keys.push(...[...leaf.keys].reverse());
            leaf = leaf.prev;
        }
        expect(keys).toEqual(Array.from({ length: 20 }, (_, i) => BigInt(20 - i)));
    });

    test("duplicate key overwrites value", () => {
        const tree = new BPlusTree<string>(4);
        tree.insert(10n, "old");
        tree.insert(10n, "new");
        expect(tree.size).toBe(1);
        expect(tree.get(10n)).toBe("new");
    });

    test("large insert + delete stress (order 64)", () => {
        const tree = new BPlusTree<number>(64);
        for (let i = 0n; i < 1000n; i++) {
            tree.insert(i, Number(i));
        }
        expect(tree.size).toBe(1000);
        expect(tree.min()).toBe(0n);
        expect(tree.max()).toBe(999n);

        for (let i = 0n; i < 500n; i++) {
            tree.delete(i);
        }
        expect(tree.size).toBe(500);
        expect(tree.min()).toBe(500n);

        for (let i = 500n; i < 1000n; i++) {
            expect(tree.get(i)).toBe(Number(i));
        }
    });

    test("minEntry and maxEntry return key-value pairs", () => {
        const tree = new BPlusTree<string>(4);
        tree.insert(5n, "five");
        tree.insert(15n, "fifteen");
        expect(tree.minEntry()).toEqual({ key: 5n, value: "five" });
        expect(tree.maxEntry()).toEqual({ key: 15n, value: "fifteen" });
    });

    test("minEntry and maxEntry return null on empty tree", () => {
        const tree = new BPlusTree<string>(4);
        expect(tree.minEntry()).toBeNull();
        expect(tree.maxEntry()).toBeNull();
    });
});
