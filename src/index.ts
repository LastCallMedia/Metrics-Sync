
import {Client} from 'elasticsearch'
import factory, {SyncSpec} from './sync/factory';
import * as Promise from 'bluebird'

export default function(elasticsearch: object, sources: Array<SyncSpec>) {
    const es = new Client(elasticsearch)
    const sourceObjects = sources.map(factory)

    const result = Promise.map(sourceObjects, async function(source) {
        return es.bulk({
            index: source.getIndex(),
            type: source.getType(),
            body: await source.getData()
        })
    }, {concurrency: 2})

    return result
}

export type Config = {
    elasticsearch: string
    syncs: Array<SyncSpec>
}