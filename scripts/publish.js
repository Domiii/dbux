/* eslint no-console: 0 */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

// Examples (don't use yarn, it won't work!):
//
// npm run pub -- n
// npm run pub -- n marketplace
// npm run pub -- n marketplace patch
// npm run pub -- n marketplace minor
//

const DefaultVersionBump = 'prerelease';

let chooseAlwaysNo = false;
let forceMarketplace = undefined;
let chooseVersionBump;

const path = require('path');
const fs = require('fs');
// const open = require('open');
const isArray = require('lodash/isArray');

const run = require('./run');
const LineReader = require('./LineReader');

require('./dbux-register-self');    // add babel-register, so we can import dbux src files
require('../dbux-common/src/util/prettyLogs');    // make console log pretty

const Process = require('../dbux-projects/src/util/Process').default;

const { readPackageJsonVersion } = require('../dbux-cli/lib/package-util');
const { downgradeProdVersion } = require('./fix-versions');
const { newLogger } = require('../dbux-common/src/log/logger');

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

  const val = chooseAlwaysNo ? 'n' : await input.readLine();
  return val === 'y';
}

// ###########################################################################
// branch management
// ###########################################################################

function getBranchName() {
  return run('git branch --show-current');
}

function goToMaster() {
  log('Switching to master');
  run('git checkout master');
  run('git pull');
  if (getBranchName() !== 'master') {
    throw new Error(`Could not switch to master - current branch is "${getBranchName()}"`);
  }
}

async function pullMaster() {
  // const result = await menu('Pull master?', {
  //   1: ['Yes', () => run(`git pull origin dev`)],
  //   2: 'No'
  // });
  const yes = !await yesno('Skip pull master?');
  if (yes) {
    const result = run(`git pull origin master`);

    const ownName = path.basename(__filename);
    if (result && result.includes(ownName)) {
      throw new Error(`Publish script ${ownName} (probably) has changed. Please run again to make sure.`);
    }
  }
}

/** ###########################################################################
 * versioning
 * ##########################################################################*/

function getDbuxVersion() {
  return readPackageJsonVersion(path.join(__dirname, '../dbux-cli'));
}

async function isDevVersion() {
  return (await getDbuxVersion()).includes('dev');
}

/**
 * Bump version and produce new git tag
 */
async function bumpVersion() {
  let choice = chooseVersionBump || (await menu('Version bump?', {
    1: ['(skip)'],
    2: ['prerelease'],
    3: ['patch'],
    4: ['minor'],
    5: ['major']
  }))[0];

  const bumped = choice !== '(skip)';

  if (bumped) {
    await exec(`npx lerna version ${choice} --preid=dev --force-publish -y`);
  }

  return bumped;
}

// function build() {
//   // NOTE: this will be done automatically when publishing
//   run(`yarn build:prod`);
// }

async function ensureProdVersion() {
  if (await isDevVersion()) {
    // console.warn('Not publishing');
    const msg = `Invalid version ${await getDbuxVersion()} - Cannot publish dev version.`;
    console.error(msg);
    throw new Error(msg);
  }
}


/** ###########################################################################
 * publish
 * ##########################################################################*/

async function publishToNPM() {
  // publish dependencies to NPM
  // NOTE: will trigger build scripts before publishing
  log('Publishing to NPM...');
  let publishCmd = 'npx lerna publish -y';
  // if (await yesno('not from-package?')) {
  //   // usually, we just want to go from package, since `lerna version` already prepared things for us
  // }
  // else {
  publishCmd += ' from-package';
  // }

  // publish
  await exec(publishCmd);

  // // check package status on NPM
  // if (await yesno('Published to NPM. Open NPM website?')) {
  //   open('https://www.npmjs.com/search?q=dbux');
  // }
}

async function publishToMarketplace() {
  // check organization status on dev.azure
  // if (await yesno('Open VSCode Marketplace backend?')) {
  //   open('https://dev.azure.com/dbux');
  // }

  // // make sure dbux-code is ready
  // await exec('cd dbux-code && yarn list --prod --json');

  // don't publish dev version to marketplace
  await ensureProdVersion();

  if (await isDevVersion() && await yesno(`Currently on dev version. Downgrade and continue?`)) {
    await downgradeProdVersion();
  }

  // cannot publish dev version
  await ensureProdVersion();

  log('Publishing to marketplace...');

  // publish dbux-code to VSCode marketplace (already built)
  await exec('yarn code:publish-no-build');

  // if (await yesno('Published to Marketplace. Open extension website?')) {
  //   // open('https://marketplace.visualstudio.com/manage/publishers/Domi');
  //   open('https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code');
  // }
}

// async function pushToDev() {
//   const result = await yesno('Skip checking out and merging back into dev? ("yes" does nothing)');
//   if (!result) {
//     run(`git checkout dev && git pull origin master && git push`);
//   }
// }


// ###########################################################################
// main
// ###########################################################################

async function main() {
  input = new LineReader();
  // console.log(process.argv);
  if (process.argv[2] === 'n' || process.argv[2] === 'pre') {
    // always no && pre-release
    chooseAlwaysNo = true;
    chooseVersionBump = process.argv[3] || DefaultVersionBump;
    console.warn(`Non-interactive mode enabled: chooseAlwaysNo, chooseVersionBump='${chooseVersionBump}'`);
  }
  else if (process.argv[2] === 'marketplace') {
    // 'marketplace' implies 'n'
    chooseAlwaysNo = true;
    chooseVersionBump = process.argv[3] || 'patch';
    forceMarketplace = true;
    console.warn(`Non-interactive mode enabled: chooseAlwaysNo + forceMarketplace, chooseVersionBump='${chooseVersionBump}'`);
  }

  log(`Preparing to publish (old version: ${await getDbuxVersion()})...`);

  // check the basics
  try {
    if (await execCaptureOut('npm whoami') !== 'domiii') {
      throw new Error('Not logged into NPM. Login first with: `npm login <user>`');
    }
  }
  catch (err) {
    // eslint-disable-next-line max-len
    throw new Error(`"npm whoami failed. Make sure to...\n  (1) to "npm login" before this script and\n  (2) to run this script via "node" or "npm run"; don't run this script via "yarn run" (login status *will* bug out)\n\n${err.message}`);
  }

  if (!await execCaptureOut('cd dbux-code && npx vsce ls-publishers')) {
    throw new Error('Not logged in with VS Marketplace. Login first with: `cd dbux-code && npx vsce login Domi`');
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

  // go to and pull master
  if (getBranchName() !== 'master') {
    await goToMaster();
  }
  await pullMaster();

  try {
    // always start at the dev version
    await exec('yarn version:dev');
  }
  catch (err) {
    if (await yesno(`Unable to revert to dev version. Should I stop?`)) {
      return;
    }
  }

  // quick install (lerna will link things up correctly anyway, after version bump)
  await exec('yarn i');

  if (await bumpVersion()) {
    // build + publish
    await publishToNPM();
  }
  // else {
  //   // build -> should not be necessary, since, if anything changed, it should be re-published anyway!
  //   await exec('yarn prepublishOnly');
  // }

  if (forceMarketplace || await yesno('Publish (already built version) to Marketplace?')) {
    await publishToMarketplace();
  }
  else if (!await yesno('Skip installing locally?')) {
    await exec('yarn code:install');
  }

  await postPublish();

  // await pushToDev();

  log('Done!');

  // hackfix: not sure why, but sometimes this process stays open for some reason... gotta do some monitoring
  process.exit(0);
}

/** ###########################################################################
 * postPublish
 * ##########################################################################*/

async function postPublish() {
  await writeVersionFile();
  await fixLerna();
  await bumpToDevVersion();

  // commit + push
  await run(`git commit -am "version bump"`);
  await run(`git push`);
}

async function writeVersionFile() {
  const version = await getDbuxVersion();
  const fpath = path.join(__dirname, '../version.txt');
  fs.writeFileSync(fpath, version);
}

async function fixLerna() {
  debug('Checking for invalid entries in package.json files (lerna hackfix)...');

  await exec('yarn dbux-lerna-fix');
}

async function bumpToDevVersion() {
  if (await isDevVersion()) {
    // console.error(`Something is wrong. We are already on a dev version (${await getDbuxVersion()}). Did version bump not succeed?`);
  }
  else {
    if (!await yesno('Skip setting dev version?')) {
      // make sure we have at least one change (cannot downgrade without any committed changes)
      // bump version
      await exec(`yarn version:dev:bump`);
    }
  }
}

/** ###########################################################################
 * go!
 * ##########################################################################*/

main().catch((err) => {
  logError(err);
  process.exit(-1);
});