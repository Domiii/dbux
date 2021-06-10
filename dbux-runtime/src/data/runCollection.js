import { newLogger } from '@dbux/common/src/log/logger';

import Collection from './Collection';
import pools from './pools';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('runCollection');

class RunCollection extends Collection {
  constructor() {
    super('runs');
  }

  addRun(runId, threadId) {
    const run = pools.run.allocate();

    run.runId = this._all.length;
    this.push(run);

    run.threadId = threadId;

    if (runId !== run.runId) {
      warn("Add a run with non increment run id", runId, threadId, run);
    }

    this._send(run);

    return run;
  }
}

const runCollection = new RunCollection();

export default runCollection;