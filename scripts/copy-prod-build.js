const { resolve } = require('path');
const { readFileSync } = require('fs');
const os = require('os');

require('./dbux-register-self');    // add babel-register, so we can import dbux src files
require('../dbux-common/src/util/prettyLogs');    // make console log pretty

const Process = require('../dbux-projects/src/util/Process').default;
const { newLogger } = require('../dbux-common/src/log/logger');

// go!
const logger = newLogger();

// const execCaptureOut = (cmd, options) => Process.execCaptureOut(cmd, options, logger);
const exec = (cmd, options) => Process.exec(cmd, options, logger);

const homedir = os.homedir();
const DbuxRoot = resolve(__dirname, '..');

const folder = `.vscode/extensions`;
const version = readFileSync(resolve(DbuxRoot, 'version.txt'));
const name = `domi.dbux-code-${version}`;
const jsPath = `dist`;


const src = resolve(DbuxRoot, 'dbux-code', jsPath);
const dst = resolve(homedir, folder, name, jsPath);

console.log(`Copying build files from "${src}" to "${dst}"...`);

try {
  /**
   * T = no-target-directory (copy as-is)
   * v = verbose
   * r = recursive (probably not needed)
   * 
   * @see https://man7.org/linux/man-pages/man1/cp.1.html
   */
  exec(`cp -Tvr ${src} ${dst}`);
  console.log('\n\n\nDone.');
}
catch (err) {
  console.error(`Copying failed: ${err.stack}`);
}
