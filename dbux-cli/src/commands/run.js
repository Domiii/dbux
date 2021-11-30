/* global __non_webpack_require__ */
// import path from 'path';
import sleep from '@dbux/common/src/util/sleep';
import { requireDynamic } from '@dbux/common-node/src/util/requireUtil';
import { wrapCommand } from '../util/commandUtil';
import dbuxRegister from '../dbuxRegister';
import { processEnv } from '../util/processEnv';
import { buildCommonCommandOptions, processRemainingOptions, resolveCommandTargetPath } from '../commandCommons';

export const command = 'run <file>';
export const aliases = ['r'];
export const describe = 'Run the given file with DBUX injected and reporting. Needs a receiving runtime server (such as the DBUX VSCode extension) running.';
export const builder = buildCommonCommandOptions();

// process.env.BABEL_DISABLE_CACHE = 1;

/**
 * Run file with dbux instrumentations (using babel-register to add dbux-babel-plugin into the mix)
 */
export const handler = wrapCommand(async ({ file, _, ...moreOptions }) => {
  processEnv(moreOptions.env);

  // patch up file path
  const targetPath = resolveCommandTargetPath(file);

  // require('socket.io-client');
  // require('lodash');

  // dbuxRegister (injects babel + dbux)
  dbuxRegister(moreOptions);

  processRemainingOptions(moreOptions);

  // hackfix: patch up argv! We are cheating, to make sure, argv can get processed by the program as usual
  const programArgs = _.slice(1); //.map(arg => `"${arg}"`).join(' ');
  // console.warn('argv', process.argv);
  process.argv = [process.argv[0] /* node */, targetPath /* program */, ...programArgs];
  
  // go time!

  // TODO: if esm -> call `import` instead

  try {
    requireDynamic(targetPath);
  }
  catch (err) {
    // delay shutdown
    await sleep(2000);
    throw err;
  }
});