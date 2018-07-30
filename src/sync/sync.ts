
export default interface Sync {
    getIndex(): string
    getType(): string
    getData(): Promise<Array<RecordWithId>>
}

export type RecordWithId = {
    _id: string
}