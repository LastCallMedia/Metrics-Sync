
import {Client} from 'elasticsearch'
import factory, {SyncSpec} from './sync/factory';
import * as Promise from 'bluebird'
import {omit} from 'lodash'

export default function(elasticsearch: object, sources: Array<SyncSpec>) {
    const es = new Client(elasticsearch)
    const sourceObjects = sources.map(factory)

    const result = Promise.map(sourceObjects, async function(source) {
        const data = await source.getData();
        return es.bulk({
            index: source.getIndex(),
            type: source.getType(),
            body: data.reduce(function(records, point) {
                if(!point._id) {
                    throw new Error(`Received record without id while processing ${source.getType()}`)
                }
                return records.concat([
                    {index: {_id: point._id}},
                    omit(point, '_id')
                ])
            }, [])
        })
    }, {concurrency: 2})

    return result
}

export type Config = {
    elasticsearch: string
    syncs: Array<SyncSpec>
}

