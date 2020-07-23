// make sure, we can import dbux stuff without any problems
require('../dbux-cli/bin/_dbux-register-self');

// pretty log
require('../dbux-common/src/util/prettyLogs.js');

const path = require('path');
const readline = require('readline');
const sh = require('shelljs');
const isArray = require('lodash/isArray');

const { log, debug } = console;

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

function menu(q, options) {
  log(q);

  for (const val in Object.keys(options)) {
    const [text] = menuOption(val, options);
    log(` ${val}. ${text}`);
  }

  let val;
  let option;
  do {
    process.stdout.write('> ');
    val = readline();
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
    console.error(result.stderr);
  }

  if (result.code) {
    throw new Error(`Command "${command}" failed, exit status: ${result.code}`);
  }
}

// ###########################################################################
// 
// ###########################################################################

function goToMaster() {
  if (getBranchName() !== 'master') {
    log('Switching to master');
    run('git checkout master');
    if (getBranchName() !== 'master') {
      throw new Error('Could not switch to master');
    }
  }
}

function pullDev() {
  const result = menu('Pull dev?', {
    y: ['Yes', () => run(`git pull origin dev`)],
    n: 'No'
  });
  
  const ownName = path.basename(__filename);

  if (result.stdout.includes(ownName)) {
    throw new Error(`Publish script ${ownName} (probably) has changed. Please run again to make sure.`);
  }
}

function bumpVersion() {
  const [choice] = menu('Version bump?', {
    1: ['None'],
    2: ['patch'],
    3: ['minor'],
    4: ['major']
  });

  if (choice !== 'None') {
    run(`lerna version ${choice}`);
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

function main() {
  log('Preparing to publish...');

  goToMaster();

  pullDev();

  bumpVersion();

  // publish dependencies to NPM
  // NOTE: will trigger build scripts before publishing
  run('lerna publish');

  // publish dbux-code to VSCode marketplace
  run('npm run code:publish');
}

main();