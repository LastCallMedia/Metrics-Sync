import {SourceConfig} from '../config'
import Acquia from "./acquia";
import NewRelic from "./newrelic";
import CircleCI from "./circleci";
import Source from './source'

export default function factory(source: SourceConfig): Source {
    switch(source.type) {
        case 'acquia':
            return new Acquia(source)
        case 'newrelic':
            return new NewRelic(source)
        case 'circleci':
            return new CircleCI(source)
        default:
            throw new Error('Unknown sync type');
    }
}
