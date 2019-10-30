
import {CircleCiSourceConfig} from '../config'
import Client from '../client/circleci'
import Source from './source'
import {omit} from 'lodash'

export default class CircleCiSync implements Source {
    client: Client
    vcsType: string
    owner: string
    repo: string
    index: string

    constructor(config: CircleCiSourceConfig) {
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
        this.index = config.index ? config.index : 'circleci-YYYY-MM-DD'
    }
    getIndex() {
        return this.index
    }
    getType() {
        return 'circle_build'
    }
    async getData() {
        const builds = await this.client.getProjectBuildsPaged(this.vcsType, this.owner, this.repo, 250);

        return builds.map(function(build) {
            return Object.assign({}, omit(build, 'circle_yml'), {
                _id: `${build.vcs_type}/${build.username}/${build.reponame}/${build.build_num}`,
                '@timestamp': build.start_time
            })
        })
    }
}
