
import { URL, URLSearchParams } from 'url'
import fetch, {Request} from 'node-fetch'
import EdgeGrid from 'edgegrid'


export default class AkamaiClient {
    eg: EdgeGrid
    constructor(clientToken, clientSecret, accessToken, baseUri) {
        this.eg = new EdgeGrid(clientToken, clientSecret, accessToken, baseUri)
    }
    getCPEstats(cpCode, from, to, interval) {
        // Need to launch asynchronously.
        this.eg.auth({
            // path: `/reporting-api/v1/reports/opresponses-by-time/versions/2/report-data?start=${from}&end=${to}&interval=${interval}`,
            path: `/reporting-api/v1/reports/saastraffic-by-app/versions/1/report-data?start=${from}&end=${to}&interval=HOUR`,
            method: 'POST',
            body: JSON.stringify({
                objectType: 'cpcode',
                objectIds: [cpCode],
            })
            //cmreq-by-cpcode
        }).send(function(err, response, body) {
            console.log(err);
            console.log(body);
        })
    }
}
