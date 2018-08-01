
import Client from '../client/akamai'
import * as moment from 'moment';

export default class AkamaiSync {
    client: Client
    cp: string
    constructor(clientToken, clientSecret, accessToken, baseUri, cp) {
        this.client = new Client(clientToken, clientSecret, accessToken, baseUri);
        this.cp = cp;
    }
    async sync() {
        const to = moment().startOf('hour');
        const from = to.clone().subtract(1, 'day');

        console.log(to, from);

        await this.client.getCPEstats(this.cp, from.toISOString(), to.toISOString(), 'HOUR')
    }
}
