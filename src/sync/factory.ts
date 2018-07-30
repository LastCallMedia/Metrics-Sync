import Acquia, {AcquiaSyncConfig} from "./acquia";
import NewRelic, {NewRelicSyncConfig} from "./newrelic";
import CircleCI, {CircleCISyncConfig} from "./circleci";
import Sync from './sync'

export default function factory(sync: SyncSpec): Sync {
    switch(sync.type) {
        case 'acquia':
            return new Acquia(sync.config)
        case 'newrelic':
            return new NewRelic(sync.config)
        case 'circleci':
            return new CircleCI(sync.config)
        default:
            throw new Error('Unknown sync type');
    }
}

type AcquiaSyncSpec = {
    type: 'acquia'
    config: AcquiaSyncConfig
}
type NewRelicSyncSpec = {
    type: 'newrelic'
    config: NewRelicSyncConfig
}
type CircleCISyncSpec = {
    type: 'circleci'
    config: CircleCISyncConfig
}

export type SyncSpec = AcquiaSyncSpec | NewRelicSyncSpec | CircleCISyncSpec
