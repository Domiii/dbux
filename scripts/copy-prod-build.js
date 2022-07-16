const { resolve } = require('path');
const { readFileSync } = require('fs');
const os = require('os');

require('./dbux-register-self');    // add babel-register, so we can import dbux src files
require('../dbux-common/src/util/prettyLogs');    // make console log pretty

const NestedError = require(`../dbux-common/src/NestedError`);
const Process = require('../dbux-projects/src/util/Process').default;
const { newLogger } = require('../dbux-common/src/log/logger');

// go!
const logger = newLogger();

// const execCaptureOut = (cmd, options) => Process.execCaptureOut(cmd, options, logger);
const exec = (cmd, options) => Process.exec(cmd, options, logger);


let nCopy = 0;

async function cp(src, dst) {
  console.log(`${++nCopy}) Copying build files from "${src}" to "${dst}"...`);

  try {
    /**
     * T = no-target-directory (copy as-is)
     * v = verbose
     * r = recursive (probably not needed)
     * 
     * @see https://man7.org/linux/man-pages/man1/cp.1.html
     */
    await exec(`cp -Tvr ${src} ${dst}`);
    console.log('  → Done.');
  }
  catch (err) {
    throw new NestedError('Copying failed', err);
  }
}

const homedir = os.homedir();
const DbuxRoot = resolve(__dirname, '..');

const folder = `.vscode/extensions`;
const version = readFileSync(resolve(DbuxRoot, 'version.txt'));
const codeFolderName = `domi.dbux-code-${version}`;
const distPath = `dist`;

const codeFolder = resolve(homedir, folder, codeFolderName);

async function cpDep(name) {
  await cp(
    resolve(DbuxRoot, 'dbux-' + name, distPath),
    resolve(codeFolder, 'node_modules/@dbux/' + name, distPath)
  );
}

(async function main() {
  await cp(
    resolve(DbuxRoot, 'dbux-code', distPath),
    resolve(codeFolder, distPath)
  );

  await cpDep('common');
  await cpDep('common-node');
  await cpDep('data');
  await cpDep('projects');
  await cpDep('runtime');
  await cpDep('babel-plugin');
  await cpDep('cli');

  // future-work: also copy graph, if necessary
})();
