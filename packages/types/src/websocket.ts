export interface WsMessage<T> {
    event :string,
    payload: T
}