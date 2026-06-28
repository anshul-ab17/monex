export interface LeafNode<V> {
    kind: "leaf";
    keys: bigint[];
    values: V[];
    prev: LeafNode<V> | null;
    next: LeafNode<V> | null;
}

interface InternalNode<V> {
    kind: "internal";
    keys: bigint[];
    children: Node<V>[];
}

type Node<V> = InternalNode<V> | LeafNode<V>;

export class BPlusTree<V> {
    private root: Node<V> | null = null;
    private _size = 0;
    private readonly maxKeys: number;
    private readonly minKeys: number;

    constructor(private readonly order: number) {
        this.maxKeys = order - 1;
        this.minKeys = Math.floor(order / 2);
    }

    get size(): number {
        return this._size;
    }

    insert(key: bigint, value: V): void {
        if (!this.root) {
            this.root = { kind: "leaf", keys: [key], values: [value], prev: null, next: null };
            this._size = 1;
            return;
        }
        const result = this.insertInto(this.root, key, value);
        if (result) {
            this.root = {
                kind: "internal",
                keys: [result.key],
                children: [result.left, result.right],
            };
        }
    }

    private insertInto(
        node: Node<V>,
        key: bigint,
        value: V,
    ): { key: bigint; left: Node<V>; right: Node<V> } | null {
        if (node.kind === "leaf") {
            const idx = this.bisect(node.keys, key);
            if (idx < node.keys.length && node.keys[idx] === key) {
                node.values[idx] = value;
                return null;
            }
            node.keys.splice(idx, 0, key);
            node.values.splice(idx, 0, value);
            this._size++;
            if (node.keys.length > this.maxKeys) {
                return this.splitLeaf(node);
            }
            return null;
        }

        const childIdx = this.bisectRight(node.keys, key);
        const result = this.insertInto(node.children[childIdx]!, key, value);
        if (!result) return null;

        node.keys.splice(childIdx, 0, result.key);
        node.children.splice(childIdx, 1, result.left, result.right);
        if (node.keys.length > this.maxKeys) {
            return this.splitInternal(node);
        }
        return null;
    }

    private splitLeaf(
        node: LeafNode<V>,
    ): { key: bigint; left: Node<V>; right: Node<V> } {
        const mid = Math.ceil(node.keys.length / 2);
        const right: LeafNode<V> = {
            kind: "leaf",
            keys: node.keys.splice(mid),
            values: node.values.splice(mid),
            prev: node,
            next: node.next,
        };
        if (node.next) node.next.prev = right;
        node.next = right;
        return { key: right.keys[0]!, left: node, right };
    }

    private splitInternal(
        node: InternalNode<V>,
    ): { key: bigint; left: Node<V>; right: Node<V> } {
        const mid = Math.floor(node.keys.length / 2);
        const upKey = node.keys[mid]!;
        const right: InternalNode<V> = {
            kind: "internal",
            keys: node.keys.splice(mid + 1),
            children: node.children.splice(mid + 1),
        };
        node.keys.pop(); // remove the promoted key
        return { key: upKey, left: node, right };
    }

    get(key: bigint): V | null {
        const leaf = this.findLeaf(key);
        if (!leaf) return null;
        const idx = this.bisect(leaf.keys, key);
        if (idx < leaf.keys.length && leaf.keys[idx] === key) {
            return leaf.values[idx]!;
        }
        return null;
    }

    delete(key: bigint): boolean {
        if (!this.root) return false;
        const deleted = this.deleteFrom(this.root, key);
        if (!deleted) return false;
        this._size--;
        if (this.root.kind === "internal" && this.root.children.length === 1) {
            this.root = this.root.children[0]!;
        }
        if (this.root.kind === "leaf" && this.root.keys.length === 0) {
            this.root = null;
        }
        return true;
    }

    private deleteFrom(node: Node<V>, key: bigint): boolean {
        if (node.kind === "leaf") {
            const idx = this.bisect(node.keys, key);
            if (idx >= node.keys.length || node.keys[idx] !== key) return false;
            node.keys.splice(idx, 1);
            node.values.splice(idx, 1);
            return true;
        }

        const childIdx = this.bisectRight(node.keys, key);
        const child = node.children[childIdx]!;
        const deleted = this.deleteFrom(child, key);
        if (!deleted) return false;

        // ponytail: minRequired=1 for root children; minKeys elsewhere
        const minRequired = node === this.root ? 1 : this.minKeys;
        if (child.kind === "leaf" && child.keys.length < minRequired) {
            this.rebalanceLeaf(node, childIdx);
        } else if (child.kind === "internal" && child.children.length < minRequired) {
            this.rebalanceInternal(node, childIdx);
        }

        return true;
    }

    private rebalanceLeaf(parent: InternalNode<V>, idx: number): void {
        const child = parent.children[idx] as LeafNode<V>;
        const leftSibling = idx > 0 ? (parent.children[idx - 1] as LeafNode<V>) : null;
        const rightSibling =
            idx < parent.children.length - 1 ? (parent.children[idx + 1] as LeafNode<V>) : null;

        if (leftSibling && leftSibling.keys.length > this.minKeys) {
            // borrow from left
            child.keys.unshift(leftSibling.keys.pop()!);
            child.values.unshift(leftSibling.values.pop()!);
            parent.keys[idx - 1] = child.keys[0]!;
        } else if (rightSibling && rightSibling.keys.length > this.minKeys) {
            // borrow from right
            child.keys.push(rightSibling.keys.shift()!);
            child.values.push(rightSibling.values.shift()!);
            parent.keys[idx] = rightSibling.keys[0]!;
        } else if (leftSibling) {
            // merge into left
            leftSibling.keys.push(...child.keys);
            leftSibling.values.push(...child.values);
            leftSibling.next = child.next;
            if (child.next) child.next.prev = leftSibling;
            parent.keys.splice(idx - 1, 1);
            parent.children.splice(idx, 1);
        } else if (rightSibling) {
            // merge right into child
            child.keys.push(...rightSibling.keys);
            child.values.push(...rightSibling.values);
            child.next = rightSibling.next;
            if (rightSibling.next) rightSibling.next.prev = child;
            parent.keys.splice(idx, 1);
            parent.children.splice(idx + 1, 1);
        }
    }

    private rebalanceInternal(parent: InternalNode<V>, idx: number): void {
        const child = parent.children[idx] as InternalNode<V>;
        const leftSibling = idx > 0 ? (parent.children[idx - 1] as InternalNode<V>) : null;
        const rightSibling =
            idx < parent.children.length - 1
                ? (parent.children[idx + 1] as InternalNode<V>)
                : null;

        if (leftSibling && leftSibling.keys.length > this.minKeys) {
            // rotate right: pull separator down, push left's last child up
            child.keys.unshift(parent.keys[idx - 1]!);
            child.children.unshift(leftSibling.children.pop()!);
            parent.keys[idx - 1] = leftSibling.keys.pop()!;
        } else if (rightSibling && rightSibling.keys.length > this.minKeys) {
            // rotate left: pull separator down, push right's first child up
            child.keys.push(parent.keys[idx]!);
            child.children.push(rightSibling.children.shift()!);
            parent.keys[idx] = rightSibling.keys.shift()!;
        } else if (leftSibling) {
            // merge child into left
            leftSibling.keys.push(parent.keys[idx - 1]!, ...child.keys);
            leftSibling.children.push(...child.children);
            parent.keys.splice(idx - 1, 1);
            parent.children.splice(idx, 1);
        } else if (rightSibling) {
            // merge right into child
            child.keys.push(parent.keys[idx]!, ...rightSibling.keys);
            child.children.push(...rightSibling.children);
            parent.keys.splice(idx, 1);
            parent.children.splice(idx + 1, 1);
        }
    }

    min(): bigint | null {
        const leaf = this.minLeaf();
        return leaf && leaf.keys.length > 0 ? leaf.keys[0]! : null;
    }

    max(): bigint | null {
        const leaf = this.maxLeaf();
        return leaf && leaf.keys.length > 0 ? leaf.keys[leaf.keys.length - 1]! : null;
    }

    minEntry(): { key: bigint; value: V } | null {
        const leaf = this.minLeaf();
        if (!leaf || leaf.keys.length === 0) return null;
        return { key: leaf.keys[0]!, value: leaf.values[0]! };
    }

    maxEntry(): { key: bigint; value: V } | null {
        const leaf = this.maxLeaf();
        if (!leaf || leaf.keys.length === 0) return null;
        const last = leaf.keys.length - 1;
        return { key: leaf.keys[last]!, value: leaf.values[last]! };
    }

    minLeaf(): LeafNode<V> | null {
        if (!this.root) return null;
        let node: Node<V> = this.root;
        while (node.kind === "internal") {
            node = node.children[0]!;
        }
        return node;
    }

    maxLeaf(): LeafNode<V> | null {
        if (!this.root) return null;
        let node: Node<V> = this.root;
        while (node.kind === "internal") {
            node = node.children[node.children.length - 1]!;
        }
        return node;
    }

    private findLeaf(key: bigint): LeafNode<V> | null {
        if (!this.root) return null;
        let node: Node<V> = this.root;
        while (node.kind === "internal") {
            const idx = this.bisectRight(node.keys, key);
            node = node.children[idx]!;
        }
        return node;
    }

    // bisect-left: first index where keys[i] >= key
    private bisect(keys: bigint[], key: bigint): number {
        let lo = 0, hi = keys.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (keys[mid]! < key) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    // bisect-right: first index where keys[i] > key
    private bisectRight(keys: bigint[], key: bigint): number {
        let lo = 0, hi = keys.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (keys[mid]! <= key) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
