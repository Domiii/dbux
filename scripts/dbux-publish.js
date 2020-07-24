/* eslint no-console: 0 */

const path = require('path');
const sh = require('shelljs');
const open = require('open');
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

  if (await Process.execCaptureOut('npm whoami') !== 'domiii') {
    throw new Error('Not logged into NPM. Login first with: `npm login <user>`');
  }

  if (!await Process.execCaptureOut('cd dbux-code && npx vsce ls-publishers')) {
    throw new Error('Not logged in with VS Marketplace. Login first with: `cd dbux-code && npx vsce login dbux`');
  }

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
  log('Publishing to NPM...');
  let publishCmd = 'npx lerna publish';
  if (await yesno('publish from-package?')) {
    // NOTE: use this if cannot publish but versioning already happened - 'npx lerna publish from-package'
    publishCmd += ' from-package';
  }
  await Process.exec(publishCmd);

  // check package status on NPM
  if (await yesno('Check NPM packages online?')) {
    await open('https://www.npmjs.com/search?q=dbux');
  }

  if (await yesno('Check VSCode Marketplace backend?')) {
    await open('https://dev.azure.com/dbux');
  }

  // after version bump, things are not linked up correctly anymore
  await Process.exec('npx lerna bootstrap --force-local && npx lerna link --force-local');

  // make sure dbux-code is ready
  await Process.exec('cd dbux-code && yarn list --prod --json');

  // publish dbux-code to VSCode marketplace
  await Process.exec('npm run code:publish');

  if (await yesno('Check out extension on Marketplace?')) {
    await open('https://marketplace.visualstudio.com/manage/publishers/Domi');
  }
}

main().catch((err) => {
  logError(err);
  process.exit(-1);
});