
import { URL, URLSearchParams } from 'url'
import fetch from '../fetch-retry'
import {Request} from 'node-fetch'

export default class NewRelicClient {
    apiKey: string
    constructor(apiKey: string) {
        this.apiKey = apiKey;
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
        return this.send(url)
    }
    send(request: Request|URL) {
        const authenticated = new Request(request, {
            headers: {
                'X-Api-key': this.apiKey
            }
        });
        return fetch(authenticated)
            .then(response => response.json())
            .then(body => {
                // Error checking.
                if(body.hasOwnProperty('error') && body.error) {
                    throw new Error(body.error.title)
                }
                return body
            })
            .catch(err => {
                throw new Error(`NewRelicClient Error: ${err.message}`)
            })
    }
}
