
import Client from '../client/circleci'
import Sync from './sync'

export type CircleCISyncConfig = {
    apiKey: string
    vcsType: string
    owner: string
    repo: string
}

export default class CircleCiSync implements Sync {
    client: Client
    vcsType: string
    owner: string
    repo: string

    constructor(config: CircleCISyncConfig) {
        if(!config.apiKey) {
            throw new Error('Missing apiToken')
        }
        if(!config.vcsType) {
            throw new Error('Missing vcsType')
        }
        if(!config.owner) {
            throw new Error('Missing owner')
        }
        if(!config.repo) {
            throw new Error('Missing repo')
        }
        this.client = new Client(config.apiKey);
        this.vcsType = config.vcsType
        this.owner = config.owner
        this.repo = config.repo
    }
    getIndex() {
        return 'circleci';
    }
    getType() {
        return 'build'
    }
    async getData() {
        const builds = await this.client.getProjectBuildsPaged(this.vcsType, this.owner, this.repo, 250);

        return builds.reduce((collected, build) => {
            // ES Bulk API action description/metadata.
            collected.push({index: {_id: `${build.vcs_type}/${build.username}/${build.reponame}/${build.build_num}`}})
            // Remove the circle config.  It's just noise.
            delete build.circle_yml.string
            collected.push(build);
            return collected
        }, [])
    }
}
