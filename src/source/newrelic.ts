
import {NewRelicSourceConfig} from '../config'
import Client from '../client/newrelic'
import * as moment from 'moment';
import Source from './source'

export default class NewRelicSync implements Source {
    client: Client
    appId: number
    names: Array<string>
    index: string
    constructor(config: NewRelicSourceConfig) {
        if(!config.apiKey) {
            throw new Error('Missing apiKey')
        }
        if(!config.appId) {
            throw new Error('Missing appId')
        }
        this.client = new Client(config.apiKey);
        this.appId = config.appId;
        this.names = config.names ? config.names : ['HttpDispatcher'];
        this.index = config.index ? config.index : 'newrelic-YYYY-MM-DD'
    }
    getIndex() {
        return this.index
    }
    getType() {
        return 'newrelic_metric'
    }
    async getData() {
        const appId = this.appId;
        const names = this.names;
        const to = moment().startOf('hour');
        const from = moment().subtract(1, 'day');
        const response = await this.client.getMetrics(appId, names, from.toISOString(), to.toISOString(), 3600);
        const metrics = response.metric_data.metrics;

        // Metrics is an array of metric objects. Each metric object contains an array of timeslices
        // that are consistent across all metrics.  Convert to an array of timeslices, where each
        // timeslice is an object that has a key for each metric.
        const slices = metrics.reduce(function(collected, metric, idx) {
            metric.timeslices.forEach((slice, i) => {
                if(!collected[i]) collected[i] = {from: slice.from, to: slice.to}
                collected[i][metric.name] = slice.values
            })
            return collected
        }, [])

        return slices.map(function(slice) {
            return Object.assign({}, slice, {
                _id: `${appId}/${slice.from}/${slice.to}`,
                '@timestamp': slice.from,
                appId: appId
            })
        })
    }
}
