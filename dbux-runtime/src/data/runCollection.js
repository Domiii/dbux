import Collection from './Collection';
import pools from './pools';

class RunCollection extends Collection {
  constructor() {
    super('runs');
  }

  run(threadId) {
    const run = pools.run.allocate();

    run.runId = this._all.length;
    this.push(run);

    run.threadId = threadId;

    this._send(run);

    return run;
  }
}

const runCollection = new RunCollection();

export default runCollection;