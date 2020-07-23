// import path from 'path';
import process from 'process';
import { wrapCommand } from '../util/commandUtil';
import dbuxRegister from '../dbuxRegister';

export const command = 'run <file>';
export const aliases = [];
// export const describe = '';
export const builder = {
};



/**
 * Run file with dbux instrumentations (using babel-register to add dbux-babel-plugin into the mix)
 */
export const handler = wrapCommand(({ file }) => {
  process.env.BABEL_DISABLE_CACHE = 1;

  // 0. patch up file path
  const targetPath = file;
  // fs.realpathSync(file);

  // 1. dbuxRegister
  dbuxRegister(targetPath);

  // go time!
  // eslint-disable-next-line
  require(targetPath);
});