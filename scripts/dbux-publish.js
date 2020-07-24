/* eslint no-console: 0 */

const path = require('path');
const sh = require('shelljs');
const isArray = require('lodash/isArray');
const LineReader = require('./LineReader');

// make sure, we can import dbux stuff without any problems
require('../dbux-cli/bin/_dbux-register-self');

// pretty log
require('../dbux-common/src/util/prettyLogs');

// Process
const Process = require('../dbux-projects/src/util/Process').default;

const { log, debug, error: logError } = console;


let input;

// ###########################################################################
// menu
// ###########################################################################

function menuOption(val, options) {
  const option = options[val];
  if (!option) {
    return null;
  }
  return isArray(option) ? option : [option];
}

async function menu(q, options) {
  log(q);

  for (const val of Object.keys(options)) {
    const [text] = menuOption(val, options);
    log(` ${val}) ${text}`);
  }

  let val;
  let option;
  do {
    process.stdout.write('> ');
    val = await input.readLine();
    option = menuOption(val, options);
  } while (!option);

  const [resultText, cb] = option;
  log(`> (${resultText})`);

  return cb ? cb(resultText, val) : [resultText, val];
}

// ###########################################################################
// run
// ###########################################################################

function run(command) {
  const cwd = path.resolve(path.join(__dirname, '..'));
  debug(`${cwd}$ ${command}`);
  const result = sh.exec(command, { cwd, silent: true });
  if (result.stdout) {
    debug(result.stdout);
  }
  if (result.stderr) {
    logError(result.stderr);
  }

  if (result.code) {
    throw new Error(`Command "${command}" failed, exit status: ${result.code}`);
  }

  return result.stdout.trim();
}

// ###########################################################################
// 
// ###########################################################################

function goToMaster() {
  if (getBranchName() !== 'master') {
    log('Switching to master');
    run('git checkout master');
    if (getBranchName() !== 'master') {
      throw new Error(`Could not switch to master - current branch is "${getBranchName()}"`);
    }
  }
}

async function pullDev() {
  const result = await menu('Pull dev?', {
    1: ['Yes', () => run(`git pull origin dev`)],
    2: 'No'
  });
  
  const ownName = path.basename(__filename);

  if (result.stdout && result.stdout.includes(ownName)) {
    throw new Error(`Publish script ${ownName} (probably) has changed. Please run again to make sure.`);
  }
}

async function bumpVersion() {
  const [choice] = await menu('Version bump?', {
    1: ['None'],
    2: ['patch'],
    3: ['minor'],
    4: ['major']
  });

  if (choice !== 'None') {
    await Process.exec(`npx lerna version ${choice} --force-publish`);
  }
}

// function build() {
//   // NOTE: this will be done automatically when publishing
//   run(`npm run build:prod`);
// }

// ###########################################################################
// utilities
// ###########################################################################

function getBranchName() {
  return run('git branch --show-current');
}

// ###########################################################################
// main
// ###########################################################################

async function main() {
  input = new LineReader();
  log('Preparing to publish...');

  // await Process.exec(
  //   // 'sh -lc "echo hi ; read x; echo abc$x"',
  //   // 'sh -lc "sleep 1; echo hihi"',
  //   `python3 -c "'print(input())'"`,
  //   { 
  //     // sync: true 
  //   }
  // );

  await goToMaster();

  await pullDev();

  // bump version and produce new git tag
  await bumpVersion();

  // publish dependencies to NPM
  // NOTE: will trigger build scripts before publishing
  await Process.exec('npx lerna publish');

  // NOTE: use instead if cannot publish but versioning already happened - 'npx lerna publish from-package'

  // publish dbux-code to VSCode marketplace
  await Process.exec('npm run code:publish');
}

main().catch((err) => {
  logError(err);
  process.exit(-1);
});