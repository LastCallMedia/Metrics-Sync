
import Client from '../client/newrelic'
import * as moment from 'moment';
import Sync from './sync'

export type NewRelicSyncConfig = {
    apiKey: string
    appId: string
}

export default class NewRelicSync implements Sync {
    client: Client
    appId: string
    constructor(config: NewRelicSyncConfig) {
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
        return 'newrelic';
    }
    getType() {
        return 'hourly_metric'
    }
    async getData() {
        const appId = this.appId;
        const to = moment().startOf('hour');
        const from = moment().subtract(1, 'day');
        const response = await this.client.getMetrics(this.appId, ['HttpDispatcher'], from.toISOString(), to.toISOString(), 3600);
        const timeslices = mapTimeslices(response.metric_data.metrics[0].timeslices);

        return timeslices.reduce(function(collected, timeslice) {
            collected.push({index: {_id: `${appId}/${timeslice.from}/${timeslice.to}`}})
            collected.push(timeslice)
            return collected
        }, [])
    }
}

function mapTimeslices(timeslices) {
    return timeslices.map(function(timeslice) {
        // Flatten the timeslice.
        return Object.assign({}, timeslice.values, {
            from: timeslice.from,
            to: timeslice.to,
        });
    });
}
