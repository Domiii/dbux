import merge from 'lodash/merge';
import semver from 'semver';
import { newLogger } from '@dbux/common/src/log/logger';
import Process from './util/Process';
import which, { hasWhich } from './util/which';

/** @typedef {import('./ProjectsManager').default} ProjectManager */

const logger = newLogger('checkSystem');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

const option = { failOnStatusCode: false };

let previousSuccess = false;

/**
 * @param {ProjectManager} manager 
 */
async function updateCheckedStatus(success) {
  // return await manager.externals.storage.set(keyName, status);
  previousSuccess = success;
}

/**
 * @param {ProjectManager} manager 
 */
function isChecked(/* manager */) {
  // return manager.externals.storage.get(keyName, false);
  return previousSuccess;
}

/**
 * Find real path to `program`.
 * @param {string} program the program(command) name
 * @return {object} contains `path` if path to `program` is found.
 */
async function check(program) {
  try {
    let paths = await which(program);
    if (!paths?.length) {
      return {};
    }
    return { path: paths[0], multiple: paths.length > 1 };
  } catch (err) {
    return {};
  }
}

/**
 * Parse output of `node -v` and parse major version as integer to return.
 * @return {number} major version of `node`, `0` if parse failed or not installed.
 */
// async function getNodeVersion() {
//   let result = await Process.execCaptureOut(`node -v`, option);

//   let matchResult = result.match(/v(\d*)/);
//   return matchResult ? parseInt(matchResult[1], 10) : 0;
// }

/**
 * Get version of `program`.
 * @param {string} program 
 * @return {Promise<string>} semver of `program`
 */
async function getVersion(program) {
  let result = await Process.execCaptureOut(`${program} --version`, option);

  return semver.valid(semver.coerce(result));
}

/**
 * Check if the current running OS is windows.
 * @return {boolean} if the windows is windows.
 */
function isWindows() {
  return process.platform === 'win32';
}

/**
 * @param {ProjectManager} projectManager 
 * @param {object} requirement
 * @param {boolean} calledFromUser 
 */
async function _checkSystem(projectManager, requirement, calledFromUser) {
  if (!calledFromUser && isChecked(projectManager)) return;

  let results = {};

  let success = true;
  let modalMessage = 'Dbux requires the following programs to be installed and available on your system in order to run smoothly.' +
    ' Please make sure, you have all of them installed.\n\n';

  if (await hasWhich()) {
    for (let program of Object.keys(requirement)) {
      results[program] = await check(program);
    }

    results.node.path && (results.node.version = await getVersion(`node`));

    modalMessage += `✓  which/where.exe\n`;
  } else {
    success = false;
    modalMessage += `x  which/where.exe\n` +
      `    Cannot run the system check because you are on a legacy system. ` +
      `We need "where.exe" to be available on Windows (available from Windows 7 and Windows Server 2003 onward), ` +
      `and "which" on any other system. ` +
      `If you are on Windows, please refer to: https://superuser.com/questions/49104/how-do-i-find-the-location-of-an-executable-in-window.\n`;
  }

  // debug(requirement, results);

  for (let program of Object.keys(requirement)) {
    let message = '';

    let req = requirement[program];
    let res = results[program];

    if (res?.path && (!req.version || semver.satisfies(res.version, req.version))) {
      message += `✓  ${program}\n    Found at "${res.path}"` + (req.version ? ` (v${res.version} satisfies ${req.version})` : ``);
      res.success = true;
      if (res.multiple) {
        message += `\n    Warning: multiple path found while checking.`;
      }
    } else if (res?.path) {
      message += `¯\\_(ツ)_/¯ "${program}" installed but old. Version is ${res.version} but we recommend ${req.version}. ` +
        `Your version might or might not work. We strongly recommend upgrading to latest (or at least a later) version instead.`;
      // success = false;
    } else if (res) {
      message += `x    ${program} not found.`;
      res.success = success = false;
    } else {
      message += `?    ${program} not tested.`;
      success = false;
      requirement[program] = { success: false };
    }

    modalMessage += `${message}\n`;
  }

  modalMessage += success ?
    `\nSUCCESS! All system dependencies seem to be in order.` :
    `\nPROBLEM: One or more system dependencies are not installed. Fix them, then try again.`;

  // debug(success, modalMessage);

  if ((results?.git?.success === false || results?.bash?.success === false) && isWindows()) {
    modalMessage += '\n\nWindows users can install bash and git into $PATH by installing "git" ' +
      'and checking the "adding UNIX tools to PATH". You can achieve that by:\n' +
      '1. Installing choco\n' +
      '2. then run: choco install git.install --params "/GitAndUnixToolsOnPath"';
  }

  let ignore = false;
  if (!success || calledFromUser) {
    if (success) {
      await projectManager.externals.showMessage.info(modalMessage, {}, { modal: true });
    }
    else {
      const options = !calledFromUser ? {
        [`Ignore and run anyway!`]: () => {
          ignore = true;
        }
      } : {};
      await projectManager.externals.showMessage.warning(modalMessage, options, { modal: true });
    }
  }

  if (!success && !calledFromUser && !ignore) {
    throw new Error(`[Dbux] System dependency check failed :(`);
  }

  await updateCheckedStatus(success);
}

export function getRequirement(fullCheck) {
  if (!fullCheck) {
    return {
      node: { version: ">=12" },
      npm: {},
    };
  }
  else {
    return {
      bash: {},
      node: { version: ">=12" },
      npm: {},
      git: {},
    };
  }
}

/**
 * Entry point of checking system compatibility
 * @param {ProjectManager} projectManager
 * @param {boolean} calledFromUser Whether the function is called by user. Decides showing success message to user or not.
 * @param {boolean} fullCheck if false, skip checking `git` and `bash`.
 */
export async function checkSystem(projectManager, calledFromUser, fullCheck) {
  const requirement = getRequirement(fullCheck);
  await _checkSystem(projectManager, requirement, calledFromUser);
}

/**
 * Check system with custom requirement.
 * @param {ProjectManager} projectManager 
 * @param {object} requirement 
 */
export async function checkSystemWithRequirement(projectManager, requirement) {
  requirement = merge({}, getRequirement(true), requirement);
  await _checkSystem(projectManager, requirement, false);
}