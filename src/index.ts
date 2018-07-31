
import {Client} from 'elasticsearch'
import factory, {SyncSpec} from './sync/factory';
import * as Promise from 'bluebird'
import {omit} from 'lodash'
import * as moment from 'moment'

export default function(elasticsearch: object, sources: Array<SyncSpec>) {
    const es = new Client(elasticsearch)

    const result = Promise.map(sources, async function(sourceConfig) {
        const source = factory(sourceConfig)
        const data = await source.getData()
        const indexName = function(record) {
            return source.getIndex().replace('YYYY-MM-DD', function() {
                return moment(record['@timestamp']).format('YYYY-MM-DD')
            })
        }

        return es.bulk({
            type: source.getType(),
            body: data.reduce(function(records, point) {
                if(!point._id) {
                    throw new Error(`Received record without id while processing ${source.getType()}`)
                }
                return records.concat([
                    {index: {
                        _id: point._id, _index: indexName(point)}
                    },
                    omit(point, '_id')
                ])
            }, [])
        })

    }, {concurrency: 2});

    return result
}

