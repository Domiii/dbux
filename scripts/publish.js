/* eslint no-console: 0 */

const path = require('path');
const sh = require('shelljs');
const open = require('open');
const LineReader = require('./LineReader');

// modules not available here?
const isArray = require('../dbux-cli/node_modules/lodash/isArray');

// make sure, we can import dbux stuff without any problems
require('../dbux-cli/bin/_dbux-register-self');

// Dbux built-in utilities
require('../dbux-common/src/util/prettyLogs');
const { newLogger } = require('../dbux-common/src/log/logger');
const Process = require('../dbux-projects/src/util/Process').default;

const logger = newLogger();
const execCaptureOut = (cmd, options) => Process.execCaptureOut(cmd, options, logger);
const exec = (cmd, options) => Process.exec(cmd, options, logger);

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

async function yesno(q) {
  q = `${q} (y/N)`;
  // process.stderr.write(q); // NOTE: write() won't flush and there is no way to force it...?
  log(q);

  const val = await input.readLine();
  return val === 'y';
}

// ###########################################################################
// run
// ###########################################################################

function run(command) {
  const cwd = path.resolve(path.join(__dirname, '..'));
  debug(` ${cwd}$ ${command}`);
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
  // const result = await menu('Pull dev?', {
  //   1: ['Yes', () => run(`git pull origin dev`)],
  //   2: 'No'
  // });
  const result = await yesno('Pull dev?');
  if (result) {
    run(`git pull origin dev`);

    const ownName = path.basename(__filename);

    if (result.stdout && result.stdout.includes(ownName)) {
      throw new Error(`Publish script ${ownName} (probably) has changed. Please run again to make sure.`);
    }
  }
}

/**
 * Bump version and produce new git tag
 */
async function bumpVersion() {
  const [choice] = await menu('Version bump?', {
    1: ['None'],
    2: ['patch'],
    3: ['minor'],
    4: ['major']
  });

  if (choice !== 'None') {
    await exec(`npx lerna version ${choice} --force-publish`);
  }
}

// function build() {
//   // NOTE: this will be done automatically when publishing
//   run(`npm run build:prod`);
// }

async function publishToNPM() {
  // publish dependencies to NPM
  // NOTE: will trigger build scripts before publishing
  log('Publishing to NPM...');
  let publishCmd = 'npx lerna publish';
  if (await yesno('not from-package?')) {
    // usually, we just want to go from package, since `lerna version` already prepared things for us
  }
  else {
    publishCmd += ' from-package';
  }
  await exec(publishCmd);

  // check package status on NPM
  if (await yesno('Check NPM packages online?')) {
    open('https://www.npmjs.com/search?q=dbux');
  }
}

async function publishToMarketplace() {
  // check organization status on dev.azure
  if (await yesno('Check VSCode Marketplace backend?')) {
    open('https://dev.azure.com/dbux');
  }

  // after version bump, things are not linked up correctly anymore
  await exec('npx lerna bootstrap --force-local && npx lerna link --force-local');

  // // make sure dbux-code is ready
  // await exec('cd dbux-code && yarn list --prod --json');

  // publish dbux-code to VSCode marketplace (already built)
  await exec('npm run code:publish:no-build');

  if (await yesno('Check out extension on Marketplace?')) {
    open('https://marketplace.visualstudio.com/manage/publishers/Domi');
  }
}

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

  await exec(`git commit -am '"dbux auto commit"'`);
  return;

  if (await execCaptureOut('npm whoami') !== 'domiii') {
    throw new Error('Not logged into NPM. Login first with: `npm login <user>`');
  }

  if (!await execCaptureOut('cd dbux-code && npx vsce ls-publishers')) {
    throw new Error('Not logged in with VS Marketplace. Login first with: `cd dbux-code && npx vsce login dbux`');
  }

  // await exec(
  //   // 'sh -lc "echo hi ; read x; echo abc$x"',
  //   // 'sh -lc "sleep 1; echo hihi"',
  //   `python3 -c "'print(input())'"`,
  //   { 
  //     // sync: true 
  //   }
  // );

  await goToMaster();

  await pullDev();

  await bumpVersion();

  await publishToNPM();

  await publishToMarketplace();
}

main().catch((err) => {
  logError(err);
  process.exit(-1);
});