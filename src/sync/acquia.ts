
import Client from '../client/acquia'
import * as moment from 'moment'
import {sum, average} from "../util"
import Sync from './sync'

export type AcquiaSyncConfig = {
    public_key: string
    private_key: string
    environmentId: string
}

export default class AcquiaSync implements Sync {
    client: Client
    environmentId: string

    constructor(config: AcquiaSyncConfig) {
        if(!config.public_key) {
            throw new Error('Missing public_key')
        }
        if(!config.private_key) {
            throw new Error('Missing private_key')
        }

        if(!config.environmentId) {
            throw new Error('Missing environmentId');
        }
        this.client = new Client(config.public_key, config.private_key);
        this.environmentId = config.environmentId;
    }
    getIndex() {
        return 'acquia';
    }
    getType() {
        return 'hourly_metric'
    }
    async getData() {
        const envId = this.environmentId
        const metrics = {
            'php-proc-max-reached-site': sum,
            'mysql-slow-query-count': sum,
            'varnish-cache-hit-rate': average,
            'http-5xx': sum,
            'http-4xx': sum,
            'http-3xx': sum,
            'http-2xx': sum
        };
        const to = moment().startOf('hour');
        const from = to.clone().subtract(1, 'day');
        const response = await this.client.getMetrics(envId, Object.keys(metrics), from.toISOString(), to.toISOString());
        const data = mapMetrics(response, metrics);

        return data.map(function(hour) {
            return Object.assign({}, hour, {
                _id: `${envId}/${hour.timestamp}`
            })
        })
    }
}

type ProcessedHour = {
    timestamp: string,
}

/**
 * Take an array of metrics broken down by arbitrary timestamps and sum/average them
 * into an array of hourly metrics.
 *
 * @param response
 */
function mapMetrics(response, metricInfo) {
    // Collect each metric into a single map grouped by hour.
    const grouped = response.reduce(function(collected, group) {
        const metricName = group.metric;

        
        const points = group.datapoints.reduce(function(collected, point) {
            const timestamp = moment.unix(point[1]).startOf('hour').toISOString();
            if (!collected.has(timestamp)) {
                collected.set(timestamp, [])
            }
            collected.get(timestamp).push(point[0])
            return collected
        }, new Map())

        // Aggregate each hour into a single data point.
        collected.set(metricName, aggregate(points, metricInfo[metricName]))

        return collected
    }, new Map())


    return join(grouped);
}

/**
 * Invoke an aggregator function for each set of entries in a map.
 *
 * @param metricMap
 * @param aggregator
 * @return {Map<string, int>}
 */
function aggregate(metricMap, aggregator) {
    const ret = new Map()
    for (let [key, values] of metricMap.entries()) {
        ret.set(key, aggregator(values))
    }
    return ret;
}

/**
 * Join a map of maps into an array of objects, with each item representing a single hour.
 *
 * @param groupedMetrics
 * @return {any[]}
 */
function join(groupedMetrics): Array<ProcessedHour> {
    const ret = {};
    for (let [metricName, metricValues] of groupedMetrics.entries()) {
        let hour, value
        for(let [hour, value] of metricValues) {
            if(!ret[hour]) {
                ret[hour] = {
                    timestamp: hour
                }
            }
            ret[hour][metricName] = value
        }
    }
    return Object.values(ret)
}
