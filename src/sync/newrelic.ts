
import {NewRelicSourceConfig} from '../config'
import Client from '../client/newrelic'
import * as moment from 'moment';
import Sync from './sync'

export default class NewRelicSync implements Sync {
    client: Client
    appId: number
    constructor(config: NewRelicSourceConfig) {
        if(!config.apiKey) {
            throw new Error('Missing apiKey')
        }
        if(!config.appId) {
            throw new Error('Missing appId')
        }
        this.client = new Client(config.apiKey);
        this.appId = config.appId;
    }
    getIndex() {
        return 'newrelic-YYYY-MM-DD';
    }
    getType() {
        return 'newrelic_metric'
    }
    async getData() {
        const appId = this.appId;
        const to = moment().startOf('hour');
        const from = moment().subtract(1, 'day');
        const response = await this.client.getMetrics(appId, ['HttpDispatcher'], from.toISOString(), to.toISOString(), 3600);
        const timeslices = mapTimeslices(response.metric_data.metrics[0].timeslices);

        return timeslices.map(function(timeslice) {
           return Object.assign({}, timeslice, {
             _id: `${appId}/${timeslice.from}/${timeslice.to}`,
             '@timestamp': timeslice.from,
             appId: appId
           })
        });
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
