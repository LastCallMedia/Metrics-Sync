
import * as yargs from 'yargs'
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import sync from './'
import * as Ajv from 'ajv'
import {Configuration} from "./config";

yargs.default('config', 'sync.yml');
yargs.config('config', function(configPath: string) {
    if(!fs.existsSync(configPath)) {
        throw new Error(`Config file does not exist: ${configPath}`)
    }
    const config = yaml.safeLoad(fs.readFileSync(configPath));
    checkConfig(config)
    return config
})

yargs.command({
    command: '*',
    handler: async function({elasticsearch, sources}) {
        console.log('Starting metrics sync');
        await sync({elasticsearch, sources})
        console.log('Metrics sync complete');
    }
})
yargs.demandCommand()

yargs.argv

function checkConfig(candidate: any): candidate is Configuration {
    const ajv = new Ajv();
    const schema = ajv.compile(require('./config.schema'))
    if(schema(candidate)) {
        return true
    }
    // console.log(JSON.stringify(schema.errors, null, 4))
    const messages = schema.errors.map(err => `  * ${err.message}`).join('\n')
    throw new Error(`Configuration validation failed with the following errors:\n${messages}`)
}