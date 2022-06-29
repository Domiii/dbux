/* global __non_webpack_require__ */
// import path from 'path';
import { pathToFileURL } from 'url';
import sleep from '@dbux/common/src/util/sleep';
import requireDynamic from '@dbux/common/src/util/requireDynamic';
import { wrapCommand } from '../util/commandUtil';
import dbuxRegister from '../dbuxRegister';
import { processEnv } from '../util/processEnv';
import { buildCommonCommandOptions, processRemainingOptions, resolveCommandTargetPath } from '../commandCommons';

export const command = 'run <file>';
export const aliases = ['r'];
export const describe = 'Run the given file with DBUX injected and reporting. Needs a receiving runtime server (such as the DBUX VSCode extension) running.';
export const builder = buildCommonCommandOptions();

// console.log('run', __non_webpack_require__.resolve('@dbux/runtime'));

// process.env.BABEL_DISABLE_CACHE = 1;

/**
 * Run file with dbux instrumentations (using babel-register to add dbux-babel-plugin into the mix)
 */
export const handler = wrapCommand(async ({ file, _, ...moreOptions }) => {
  processEnv(moreOptions.env);

  // patch up file path
  const targetPath = resolveCommandTargetPath(file);
  // const targetPath = file;

  // require('socket.io-client');
  // require('lodash');

  // dbuxRegister (injects babel + dbux)
  dbuxRegister(moreOptions);

  processRemainingOptions(moreOptions);

  // hackfix: patch up argv! We are cheating, to make sure, argv can get processed by the program as usual
  const programArgs = _.slice(1); //.map(arg => `"${arg}"`).join(' ');
  process.argv = [process.argv[0] /* node */, targetPath /* program */, ...programArgs];
  console.debug('[Dbux] run: ', ...process.argv);

  // go time!

  // TODO: if esm -> call `import` instead
  // TODO: add an "execute" (x) command which looks up the target js file to execute instead (from its `package.json` → `bin` entries)

  try {
    require('@dbux/runtime');
    requireDynamic(targetPath);

    // /**
    //  * Convert to url first.
    //  * @see https://github.com/Domiii/dbux/issues/562
    //  * @see https://github.com/nodejs/node/issues/31710
    //  */
    // const pathUrl = pathToFileURL(targetPath).href;
    // // hackfix: use `eval` to prevent webpack from trying (and failing) to resolve it statically
    // await eval(`console.log('[Dynamic import]', pathUrl), import(pathUrl)`);
  }
  catch (err) {
    // delay shutdown
    await sleep(2000);
    throw err;
  }
});
