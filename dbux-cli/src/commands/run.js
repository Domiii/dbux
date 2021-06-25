/* global __non_webpack_require__ */
// import path from 'path';
import { wrapCommand } from '../util/commandUtil';
import dbuxRegister from '../dbuxRegister';
import { processEnv } from '../util/processEnv';
import { buildCommonCommandOptions, processRemainingOptions, resolveCommandTargetPath } from '../commandCommons';

export const command = 'run <file>';
export const aliases = ['r'];
export const describe = 'Run the given file with DBUX injected and reporting. Needs a receiving runtime server (such as the DBUX VSCode extension) running.';
export const builder = buildCommonCommandOptions();

/**
 * Run file with dbux instrumentations (using babel-register to add dbux-babel-plugin into the mix)
 */
export const handler = wrapCommand(({ file, _, ...moreOptions }) => {
  processEnv(moreOptions.env);

  // patch up file path
  const targetPath = resolveCommandTargetPath(file);

  // hackfix: get some weird libraries out of the way, so that @babel/register will not instrument them
  require('cliui');
  require('socket.io-client');
  require('lodash');

  // dbuxRegister (injects babel + dbux)
  dbuxRegister(moreOptions);

  processRemainingOptions(moreOptions);

  // hackfix: patch up argv! We are cheating, to make sure, argv can get processed by the program as usual
  const programArgs = _.slice(1); //.map(arg => `"${arg}"`).join(' ');
  // console.warn('argv', process.argv);
  process.argv = [process.argv[0] /* node */, targetPath /* program */, ...programArgs];
  
  // go time!

  // see: https://stackoverflow.com/questions/42797313/webpack-dynamic-module-loader-by-requir
  // eslint-disable-next-line camelcase
  const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
  requireFunc(targetPath);
});