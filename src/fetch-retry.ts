
import fetch, {Request, RequestInit, Response} from 'node-fetch';
import * as retry from 'async-retry';

export default function(
    url: string | Request,
    init?: RequestInit
): Promise<Response> {
    const run = function() {
        return fetch(url, init)
            .then(function checkResponse(response) {
                // If we've received a response but it's a server error,
                // throw an error so we try again.
                if(response.status >= 500 && response.status < 600) {
                    throw new Error(`Received server error: ${response.statusText}`)
                }
                return response
            });
    }

    return retry(run, {
        retries: 3,
    });
}