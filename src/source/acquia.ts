
import {AcquiaSourceConfig} from '../config'
import Client from '../client/acquia'
import * as moment from 'moment'
import {sum, average} from "../util"
import Source from './source'
import {groupBy, defaultsDeep, set} from 'lodash'

export default class AcquiaSync implements Source {
    client: Client
    environmentId: string

    constructor(config: AcquiaSourceConfig) {
        this.client = new Client(config.public_key, config.private_key);
        this.environmentId = config.environmentId;
    }
    getIndex() {
        return 'acquia-YYYY-MM-DD';
    }
    getType() {
        return 'acquia_stackmetric'
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
        const data = mapMetrics(response, metrics, this.environmentId);

        return data.map(function(hour) {
            return Object.assign({}, hour, {
                _id: `${envId}/${hour.from}`,
                '@timestamp': hour.from
            })
        })
    }
}

/**
 * Turn an array of discrete metrics into an array of hourly datapoints.
 *
 * @param response
 */
function mapMetrics(response, metricInfo, environmentId) {
    // Collect each metric into a single map grouped by hour.
    const tree = response.reduce(function(collected, group) {
        const metricName = group.metric;

        // Group all datapoints for the particular metric by hour. After this,
        // we have an object where the properties are the hours, and each hour
        // has an array of datapoints, consisting of [value, timestamp].
        const points = groupBy(group.datapoints, function(point) {
            return moment.unix(point[1]).startOf('hour').toISOString();
        })

        // Loop through each hour and aggregate the points. Merge them into the
        // collected data.  After this, collected will be an object where the
        // hours are the top level properties, and each metric is a property on
        // the hour.
        Object.keys(points).forEach(function(hour) {
            let hourPoints = points[hour].map(value => value[0]);
            set(collected, [hour, metricName], metricInfo[metricName](hourPoints));
        })
        return collected
    }, {})

    // Deconstruct the tree to turn it into an array containing datapoints
    // with an additional from and to property.
    return Object.keys(tree).map(function(hour) {
        return Object.assign({}, tree[hour], {
          from: hour,
          to: moment(hour).endOf('hour'),
          environmentId: environmentId
        })
    })
}
