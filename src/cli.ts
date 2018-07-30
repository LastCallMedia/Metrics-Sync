
import * as yargs from 'yargs'
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import sync from './'


yargs.default('config', 'sync.yml');
yargs.config('config', function(configPath: string) {
    if(!fs.existsSync(configPath)) {
        throw new Error(`Config file does not exist: ${configPath}`)
    }
    const config = yaml.safeLoad(fs.readFileSync(configPath));
    validateConfig(config);
    return {
        elasticsearch: config.elasticsearch,
        sources: config.sources
    };
})

yargs.command({
    command: '*',
    handler: async function({elasticsearch, sources}) {
        console.log('Starting metrics sync');
        await sync(elasticsearch, sources)
        console.log('Metrics sync complete');
    }
})
yargs.demandCommand()

yargs.argv

function validateConfig(config) {
    if(!config ) {
        throw new Error('Config is empty');
    }
    if(!config.elasticsearch) {
        throw new Error('Config `elasticsearch` property must be set');
    }
    if(!config.sources || !Array.isArray(config.sources)) {
        throw new Error('Config `syncs` property must be an array.');
    }
}