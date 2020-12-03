import { newLogger } from '@dbux/common/src/log/logger';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';
// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ThreadColumn');

class ThreadColumn extends HostComponentEndpoint {
}

export default ThreadColumn;