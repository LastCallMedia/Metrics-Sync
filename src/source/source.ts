
export default interface Source {
    getIndex(): string
    getType(): string
    getData(): Promise<Array<SourceRecord>>
}

export type SourceRecord = {
    _id: string
    '@timestamp': string
}