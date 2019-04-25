
import { URL, URLSearchParams } from 'url'
import * as CryptoJS from 'crypto-js'
import {Request} from 'node-fetch'
import fetch from '../fetch-retry'

export default class AcquiaClient {
    signer: Signer
    base: string
    constructor(public_key: string, private_key: string) {
        this.signer = new Signer('Acquia', public_key, private_key, '2.0');
        this.base = 'https://cloud.acquia.com/api';
    }
    async getMetrics(environmentId: string, metrics: Array<string>, from: string, to: string) {
        const url = new URL(`${this.base}/environments/${environmentId}/metrics/stackmetrics/data`);
        url.search = new URLSearchParams({
            filter: metrics.map(name => `metric=${name}`).join(','),
            from,
            to
        }).toString();
        var request = new Request(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        return this.fetch(request).then(data => data._embedded.items);
    }
    async fetch(request: Request) {
        const signed = this.signer.signFetchRequest(request);
        return fetch(signed)
            .then(response => response.json())
            .then(response => {
                if(response.hasOwnProperty('error')) {
                    throw new Error(response.message);
                }
                return response
            })
            .catch(err => {
                const message = err instanceof Error ? err.message : err
                return Promise.reject(new Error(`Acquia Client: ${message}`))
            })
    }
}

/**
 * This monstrosity is what's required to authenticate requests on Acquia's V2 API.
 */
class Signer {
    private_key: string
    public_key: string
    version: string
    realm: string

    constructor(realm, public_key, private_key, version) {
        this.realm = realm;
        this.public_key = public_key;
        this.version = version;
        this.private_key = CryptoJS.enc.Base64.parse(private_key);
    }
    signFetchRequest(request: Request) {
        var timestamp = this.generateTimestamp();
        var auth = this.getAuthorization(request.method, new URL(request.url), request.headers, timestamp);

        request.headers.set('X-Authorization-Timestamp', timestamp);
        request.headers.set('Authorization', auth);
        return request;
    }
    getAuthorization(method, url, headers, timestamp, hashed_body?) {
        const content_type = headers.get('content-type');
        const nonce = this.generateNonce();

        const params = `id=${encodeURIComponent(this.public_key)}&nonce=${encodeURIComponent(nonce)}&realm=${encodeURIComponent(this.realm)}&version=${encodeURIComponent(this.version)}`;
        const string_to_sign = `${method}\n${url.hostname}${url.port ? ':' + url.port : ''}\n${url.pathname || '/'}\n${url.search ? url.search.slice(1) : ''}\n${params}\n${timestamp}${content_type ? `\n${content_type}` : ''}${hashed_body ? `\n${hashed_body}` : ''}`;
        const signature = CryptoJS.HmacSHA256(string_to_sign, this.private_key).toString(CryptoJS.enc.Base64);
        const authorization = `acquia-http-hmac realm=${this.e('Acquia')},id=${this.e(this.public_key)},nonce=${this.e(nonce)},version=${this.e(this.version)},headers="",signature=${this.e(signature)}`;

        // console.log('Params', params, '\n\n');
        // console.log('Signing', string_to_sign, '\n\n');
        // console.log('Authorization', authorization);

        return authorization;
    }
    generateTimestamp() {
        return Math.floor(Date.now() / 1000).toString();
    }
    generateNonce() {
        var d = Date.now();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : r & 0x7 | 0x8).toString(16);
        });
    }
    e(str) {
        return `"${encodeURI(str)}"`;
    }
}
