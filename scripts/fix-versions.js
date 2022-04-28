// make sure, we can import dbux stuff without any problems (and console log is pretty)
require('./dbux-register-self');
require('@dbux/common/src/util/prettyLogs');

const { newLogger } = require('@dbux/common/src/log/logger');
const Process = require('../dbux-projects/src/util/Process').default;

const { readLernaJson } = require('../dbux-cli/lib/package-util');

// go!
const logger = newLogger();
const { log, debug, error: logError } = console;

const execCaptureOut = (cmd, options) => Process.execCaptureOut(cmd, options, logger);
const exec = (cmd, options) => Process.exec(cmd, options, logger);

/** ###########################################################################
 * {@link parseLernaVersion}
 *  #########################################################################*/

function parseLernaVersion() {
  const lerna = readLernaJson();
  if (!lerna.version) {
    throw new Error('lerna.json does not have a version.');
  }

  let { version } = lerna;

  // future-work: just use `semver` instead

  // NOTE: we cannot roll with the current "dev" build version since we depend on the version to be available on the `npm` registry
  // so we must downgrade!
  const match = version.match(/(\d+)\.(\d+)\.(\d+)(-dev\.\d+)?/);
  if (!match) {
    throw new Error(`Could not parse lerna version: ${version}`);
  }
  let [_, maj, min, pat, release] = match;

  [maj, min, pat] = [maj, min, pat].map(n => parseInt(n, 10));

  return [version, maj, min, pat, release];
}

/** ###########################################################################
 * {@link setVersion}
 *  #########################################################################*/

async function setVersion(version) {
  /**
   * @see https://github.com/lerna/lerna/tree/main/commands/version
   */
  // --no-private
  // NOTE: we need --force-publish=* to force it to collect all packages (even though, it does not publish)
  const cmd = `npx lerna version ${version} --preid=dev --no-changelog --no-git-tag-version --no-push --force-publish=* -y`;
  await exec(cmd);
  // console.warn('setVersion', cmd);

  // const lernaVersion = readLernaJson().version;
  // if (lernaVersion !== version) {
  //   throw new Error(`Revert failed. Expected: ${version} - found: ${lernaVersion}`);
  // }
}

/** ###########################################################################
 * {@link downgradeProdVersion}
 *  #########################################################################*/

async function downgradeProdVersion() {
  let [version, maj, min, pat, release] = parseLernaVersion();

  if (release) {
    if (!(pat > 0)) {   // also takes care of NaN etc.
      // TODO: get previous version from `git tag` (sorted by semver)
      // cannot go negative
      throw new Error(`Cannot downgrade dev version to prod version, since patch cannot go negative: ${pat} in ${version}`);
    }
    const newVersion = `${maj}.${min}.${pat - 1}`;

    console.warn(`Downgrading version for production: ${version} -> ${newVersion}`);

    await setVersion(newVersion);
    console.warn(`Success. Downgraded to prod version: ${newVersion}`);
  }
  else {
    // NOTE: if there is no "dev" version, there is no need to downgrade
  }
}

/** ###########################################################################
 * {@link revertToDevVersion}
 *  #########################################################################*/

async function revertToDevVersion(force = false) {
  let [version, maj, min, pat, release] = parseLernaVersion();

  if (!release?.includes('dev') || force) {
    // git tag | tail
    const tags = (await execCaptureOut(`git tag`)).split('\n').reverse();

    // TODO: tags are not ordered correctly when any number has more than one digit

    let newVersion = `${maj}.${min}.${pat + 1}`;

    // future-work: just get latest version?

    const matchingTags = tags.filter(tag => tag.startsWith('v' + newVersion));

    const matchingTag = matchingTags[0];
    if (!matchingTag) {
      // eslint-disable-next-line max-len
      throw new Error(`Could not find matching tag for ${newVersion} to revert to. Usually publish.js would create it after publishing. Did it terminate early? Make sure to run it's postPublish function. In order to get back to a previous version, use the "setVersion" command: "npx lerna version ... --...."`);
    }

    console.log('matchingTags: ', matchingTags.join(', '));

    newVersion = matchingTag.substring(1);

    console.warn(`Reverting to development version: ${version} -> ${newVersion}`);

    await setVersion(newVersion);
    console.warn(`Success. Reverted to development version: ${newVersion}`);
  }
  else {
    // nothing to do
  }
}

async function nextDevVersion() {
  let [version, maj, min, pat, release] = parseLernaVersion();

  if (!release?.includes('dev')) {
    // throw new Error(`Cannot upgrade dev version while not on dev version.`);
    await revertToDevVersion();
  }

  return await setVersion('prerelease');
}


module.exports = {
  downgradeProdVersion,
  revertToDevVersion,
  nextDevVersion
};

/*
node -e "require('./scripts/fix-versions').downgradeProdVersion().then(() => process.exit(0))"
node -e "require('./scripts/fix-versions').revertToDevVersion().then(() => process.exit(0))"
*/