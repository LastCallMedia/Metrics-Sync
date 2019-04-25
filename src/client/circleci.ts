
import { URL, URLSearchParams } from 'url'
import fetch from '../fetch-retry'
import {Request} from 'node-fetch'

function handleResponse(response) {
    if (response.ok) {
        return response.json();
    }
    throw new Error(`Error ${response.status} requesting ${response.url}: ${response.statusText}`);
}

export default class CircleCIClient {
    apiKey: string
    base: string

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.base = 'https://circleci.com/api/v1.1';
    }
    async getProjectBuilds(vcsType: string, username: string, project: string, limit: number, offset: number = 0, filter?: string) {
        const url = new URL(`${this.base}/project/${vcsType}/${username}/${project}`);
        const params = new URLSearchParams({
            "circle-token": this.apiKey
        })
        if (limit) {
            params.set('limit', limit.toString())
        }
        if (offset) {
            params.set('offset', offset.toString())
        }
        if (filter) {
            params.set('filter', filter);
        }
        url.search = params.toString();

        return fetch(new Request(url, {
            headers: {
                accept: 'application/json'
            }
        })).then(handleResponse)
            .catch(err => {
                let message = err instanceof Error ? err.message : err
                message = message.replace(this.apiKey, 'XXX');
                return Promise.reject(new Error(`CircleCI Client: ${message}`))
            })
    }
    async getProjectBuildsPaged(vcsType: string, username: string, project: string, limit: number, filter?: string) {
        let offset = 0;
        let allResults = [];
        let actualLimit = Math.min(100, limit);
        while (offset < limit) {
            let theseResults = await this.getProjectBuilds(vcsType, username, project, actualLimit, offset, filter);
            if (theseResults.length > 0) {
                allResults = allResults.concat(theseResults);
                offset += actualLimit;
            } else {
                break;
            }
        }
        return allResults;
    }
}

class CircleCIError extends Error {
    constructor(previous,) {
        super('')
        let message = '';
        if(previous instanceof Error) {
            message = previous.message;
            this.stack = previous.stack;
        }
        else {
            message = previous
        }
        this.message = `CircleCI Error: ${message.toString()}`
    }
}
