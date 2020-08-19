/* eslint no-console: 0 */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

const path = require('path');
const sh = require('shelljs');
const open = require('open');
const isArray = require('lodash/isArray');
const LineReader = require('./LineReader');

// make sure, we can import dbux stuff without any problems
require('../dbux-cli/lib/dbux-register-self');

// Dbux built-in utilities
require('../dbux-common/src/util/prettyLogs');
const { newLogger } = require('../dbux-common/src/log/logger');
const Process = require('../dbux-projects/src/util/Process').default;
const { readPackageJsonVersion } = require('../dbux-cli/lib/package-util');

// go!
const logger = newLogger();
const { log, debug, error: logError } = console;

const execCaptureOut = (cmd, options) => Process.execCaptureOut(cmd, options, logger);
const exec = (cmd, options) => Process.exec(cmd, options, logger);


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
// utilities
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

function getDbuxVersion() {
  return readPackageJsonVersion(path.join(__dirname, '../dbux-code'));
}

async function isDevVersion() {
  return (await getDbuxVersion()).includes('dev');
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
  else if (await isDevVersion()) {
    const msg = `Invalid version ${await getDbuxVersion()} - Cannot publish dev version.`;
    console.error(msg);
    throw new Error(msg);
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
  // if (await yesno('not from-package?')) {
  //   // usually, we just want to go from package, since `lerna version` already prepared things for us
  // }
  // else {
  publishCmd += ' from-package';
  // }
  await exec(publishCmd);

  // check package status on NPM
  if (await yesno('Open NPM website?')) {
    open('https://www.npmjs.com/search?q=dbux');
  }
}

async function publishToMarketplace() {
  // check organization status on dev.azure
  // if (await yesno('Open VSCode Marketplace backend?')) {
  //   open('https://dev.azure.com/dbux');
  // }

  // // make sure dbux-code is ready
  // await exec('cd dbux-code && yarn list --prod --json');

  // publish dbux-code to VSCode marketplace (already built)
  await exec('npm run code:publish-no-build');

  if (await yesno('Open extension website?')) {
    // open('https://marketplace.visualstudio.com/manage/publishers/Domi');
    open('https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code');
  }
}

async function fixLerna() {
  debug('Checking for invalid entries in package.json files (lerna hackfix)...');

  await exec('npm run dbux-lerna-fix');
}

async function setDevVersion() {
  if (!await yesno('Skip setting dev version?')) {
    if (await isDevVersion()) {
      console.error(`Something is wrong. We are already on a dev version (${await getDbuxVersion()}). Did version bump not succeed?`);
    }
    else {
      // make sure, we are operating on the dev version
      await exec(`npx lerna version prepatch --preid dev --yes --force-publish`);
    }
  }
}

async function pushToDev() {
  const result = await yesno('Skip checking out and merging back into dev? ("yes" does nothing)');
  if (!result) {
    run(`git checkout dev && git pull origin master && git push`);
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
  log(`Preparing to publish (bumping from version ${await getDbuxVersion()})...`);

  if (await execCaptureOut('npm whoami') !== 'domiii') {
    throw new Error('Not logged into NPM. Login first with: `npm login <user>`');
  }

  if (!await execCaptureOut('cd dbux-code && npx vsce ls-publishers')) {
    throw new Error('Not logged in with VS Marketplace. Login first with: `cd dbux-code && npx vsce login dbux`');
  }

  // TODO: this does not work the way we would like it to
  // if (await yesno('Run start-ssh-agent?')) {
  //   await run('start-ssh-agent');
  // }

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

  if (await yesno('Published to NPM. Also publish to Marketplace?')) {
    await publishToMarketplace();
  }
  else if (await yesno('Install locally?')) {
    await exec('npm run code:install');
  }

  await fixLerna();

  await setDevVersion();

  await pushToDev();

  log('Done!');
  process.exit(0); // not sure why but this process stays open for some reason
}

main().catch((err) => {
  logError(err);
  process.exit(-1);
});