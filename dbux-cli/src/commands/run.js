/* global __webpack_require__, __non_webpack_require__ */
// import path from 'path';
import { wrapCommand } from '../util/commandUtil';
import dbuxRegister from '../dbuxRegister';
import { buildCommonCommandOptions, resolveCommandTargetPath } from '../util/commandCommons';

export const command = 'run <file>';
export const aliases = ['r'];
export const describe = 'Run the given file with DBUX injected and reporting. Needs a receiving runtime server (such as the DBUX VSCode extension) running.';
export const builder = buildCommonCommandOptions();


/**
 * Run file with dbux instrumentations (using babel-register to add dbux-babel-plugin into the mix)
 */
export const handler = wrapCommand(({ file, ...moreOptions }) => {
  // patch up file path
  const targetPath = resolveCommandTargetPath(file);
  console.debug(`Running file ${targetPath}...`);

  // dbuxRegister (injects babel + dbux)
  dbuxRegister(moreOptions);


  // see: https://stackoverflow.com/questions/42797313/webpack-dynamic-module-loader-by-require

  // go time!
  // eslint-disable-next-line camelcase
  const requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
  requireFunc(targetPath);
});