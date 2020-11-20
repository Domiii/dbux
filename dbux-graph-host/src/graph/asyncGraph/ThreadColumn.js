import { newLogger } from '@dbux/common/src/log/logger';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';
import AsyncNode from './AsyncNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ThreadColumn');

class ThreadColumn extends HostComponentEndpoint {
  init() {
    const {
      threadId
    } = this.state;

    this.children.createComponent(AsyncNode, {
      threadId,
      contextId: 1
    });
  }
}

export default ThreadColumn;