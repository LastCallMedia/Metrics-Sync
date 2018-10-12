
import {NewRelicSourceConfig} from '../config'
import Client from '../client/newrelic'
import * as moment from 'moment';
import Source from './source'

export default class NewRelicSync implements Source {
    client: Client
    appId: number
    names: Array<string>
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
    }
    getIndex() {
        return 'newrelic-YYYY-MM-DD';
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

        return [].concat(...metrics.map(function(metric) {
            const timeslices = mapTimeslices(metric.timeslices);
            return timeslices.map(function(timeslice) {
                return Object.assign({}, timeslice, {
                    _id: `${appId}/${metric.name}/${timeslice.from}/${timeslice.to}`,
                    metricname: metric.name,
                    '@timestamp': timeslice.from,
                    appId: appId
                })
            });
        }));
    }
}

function mapTimeslices(timeslices) {
    return timeslices.map(function(timeslice) {
        // Flatten the timeslice.
        return Object.assign({}, timeslice.values, {
            from: timeslice.from,
            to: timeslice.to
        });
    });
}
