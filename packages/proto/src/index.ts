import protobuf from "protobufjs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = join(__dirname, "..", "monex.proto");

let rootPromise: Promise<protobuf.Root> | null = null;

function getRoot(): Promise<protobuf.Root> {
    if (!rootPromise) {
        rootPromise = protobuf.load(PROTO_PATH);
    }
    return rootPromise;
}

export async function encode<T extends object>(messageName: string, payload: T): Promise<Uint8Array> {
    const root = await getRoot();
    const MessageType = root.lookupType(`monex.${messageName}`);
    const errMsg = MessageType.verify(payload);
    if (errMsg) throw new Error(`Proto verify ${messageName}: ${errMsg}`);
    return MessageType.encode(MessageType.create(payload)).finish();
}

export async function decode<T>(messageName: string, buffer: Uint8Array): Promise<T> {
    const root = await getRoot();
    const MessageType = root.lookupType(`monex.${messageName}`);
    return MessageType.decode(buffer).toJSON() as T;
}

export async function encodeEnvelope(eventType: string, messageName: string, payload: object): Promise<Uint8Array> {
    const innerBytes = await encode(messageName, payload);
    return encode("Envelope", {
        version: 1,
        eventType,
        timestamp: Date.now(),
        payload: innerBytes,
    });
}

export async function decodeEnvelope(buffer: Uint8Array): Promise<{ version: number; eventType: string; timestamp: number; payload: Uint8Array }> {
    return decode("Envelope", buffer);
}
