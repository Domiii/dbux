// import path from 'path';
import fs from 'fs';
import { wrapCommand } from '../util/commandUtil';
import dbuxRegister from '../dbuxRegister';
import { buildCommonCommandOptions } from '../commonCommandOptions';

export const command = 'run <file>';
export const aliases = ['r'];
// export const describe = '';
export const builder = buildCommonCommandOptions();


/**
 * Run file with dbux instrumentations (using babel-register to add dbux-babel-plugin into the mix)
 */
export const handler = wrapCommand(({ file, ...moreOptions }) => {
  // patch up file path
  const targetPath = fs.realpathSync(file);
  console.debug(`Running file ${targetPath}...`);

  // dbuxRegister (injects babel + dbux)
  dbuxRegister(moreOptions);


  // go time!
  // eslint-disable-next-line
  require(targetPath);
});