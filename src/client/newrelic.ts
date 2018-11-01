
import { URL, URLSearchParams } from 'url'
import fetch, {Request} from 'node-fetch'

export default class NewRelicClient {
    apiKey: string
    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }
    getSummary(appId: string) {
        const request = new Request(`https://api.newrelic.com/v2/applications/${appId}.json`);

        return this.send(request);
    }
    getMetrics(appId: number, names: Array<string>, from: string, to: string, period: number) {
        const url = new URL(`https://api.newrelic.com/v2/applications/${appId}/metrics/data.json`);
        const params = new URLSearchParams({
            from,
            to,
            period: period.toString()
        });
        names.forEach(name => params.append('names[]', name))
        url.search = params.toString();
        return this.send(url);
    }
    send(request: Request|URL) {
        const authenticated = new Request(request, {
            headers: {
                'X-Api-key': this.apiKey
            }
        });
        return fetch(authenticated).then(response => response.json());
    }
}
