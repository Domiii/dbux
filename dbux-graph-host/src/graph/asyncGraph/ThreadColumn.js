import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';
// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ThreadColumn');

class ThreadColumn extends HostComponentEndpoint {
  public = {
    gotoAsyncNode(applicationId, asyncNodeId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
      const firstTrace = dp.indexes.traces.byContext.getFirst(asyncNode.rootContextId);
      if (firstTrace) {
        traceSelection.selectTrace(firstTrace);
      }
    }
  }
}

export default ThreadColumn;