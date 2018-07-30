
export default interface Sync {
    getIndex(): string
    getType(): string
    getData(): Promise<Array<object>>
}