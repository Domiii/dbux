import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';
// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ThreadColumn');

class ThreadColumn extends HostComponentEndpoint {
  public = {
    gotoContext(applicationId, contextId) {
      const app = allApplications.getById(applicationId);
      const firstTrace = app.dataProvider.indexes.traces.byContext.getFirst(contextId);

      if (firstTrace) {
        traceSelection.selectTrace(firstTrace);
      }
    }
  }
}

export default ThreadColumn;