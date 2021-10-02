
/**
 * "body.pipe is not a function"
 * @see https://github.com/node-fetch/node-fetch/issues/930
 */

// node --enable-source-maps --stack-trace-limit=1000 "../../node_modules/@dbux/cli/bin/dbux.js" run --esnext --verbose=1  --pw=.* "./example.js" --

import Project from '../../projectLib/Project';
import { buildNodeCommand } from '../../util/nodeUtil';


export default class NodeFetchProject extends Project {
  gitRemote = 'node-fetch/node-fetch.git';
  gitCommit = 'tags/v2.1.2'

  packageManager = 'yarn';

  loadBugs() {
    return [
      {
        label: 'basic example1',
        // testRe: 'OPTIONS should only include each method once',
        testFilePaths: ['example1.js']
      }
    ];
  }

  decorateBugForRun(bug) {
    if (!bug.testFilePaths) {
      // bug not fully configured yet
      return;
    }

    Object.assign(bug, {
      dbuxArgs: '--pw=.* --esnext'
    });
  }
}