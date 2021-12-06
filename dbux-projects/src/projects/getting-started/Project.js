
/**
 * "body.pipe is not a function"
 * @see https://github.com/node-fetch/node-fetch/issues/930
 */

// node --enable-source-maps --stack-trace-limit=1000 "../../node_modules/@dbux/cli/bin/dbux.js" run --esnext --verbose=1  --pw=.* "./example.js" --

import Project from '../../projectLib/Project';


export default class GettingStartedProject extends Project {
  // gitRemote = 'node-fetch/node-fetch.git';
  // gitCommit = 'tags/v2.1.2'

  packageManager = 'yarn';

  decorateExercise(config) {
    Object.assign(config, {
      // dbuxArgs: '--pw=.* --esnext'
      dbuxArgs: ''
    });
    return config;
  }
}
