import merge from 'lodash/merge';
import semver from 'semver';
import { newLogger } from '@dbux/common/src/log/logger';
import Process from './util/Process';
import which from './util/which';

/** @typedef {import('./ProjectsManager').default} ProjectManager */

const logger = newLogger('checkSystem');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

const option = { failOnStatusCode: false };

let checkedRequirements = new Set();

/**
 * @param {Object} requirements 
 */
function updateCheckedRequirements(requirements) {
  checkedRequirements.add(JSON.stringify(requirements));
}

/**
 * @param {Object} requirements 
 */
function isChecked(requirements) {
  return checkedRequirements.has(JSON.stringify(requirements));
}


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
 * @param {object} requirements
 * @param {boolean} calledFromUser 
 */
async function _checkSystem(projectManager, requirements, calledFromUser) {
  if (!calledFromUser && isChecked(requirements)) {
    return;
  }

  let results = {};

  let success = true;
  let modalMessage = 'Dbux requires the following programs to be installed and available on your system in order to run smoothly.' +
    ' Please make sure, you have all of them installed.\n\n';

  for (let program of Object.keys(requirements)) {
    const result = { path: which(program) };
    let message = '';
    let requirement = requirements[program];

    if (result.path) {
      if (requirement.version) {
        result.version = await getVersion(program);
        if (semver.satisfies(result.version, requirement.version)) {
          message += `✓  ${program}\n    Found at "${result.path}" (v${result.version} satisfies ${requirement.version})`;
          result.success = true;
        }
        else {
          message += `x  "${program}"\n Installed but the version v${result.version} does not satisfies the requirement "${requirement.version}". ` +
            `Please upgrade to the required version.`;
          result.success = false;
        }
      }
      else {
        message += `✓  ${program}\n    Found at "${result.path}"`;
        result.success = true;
      }
    }
    else {
      message += `x  ${program}\n    Not found.`;
      result.success = false;
    }

    if (!result.success) {
      success = false;
    }

    modalMessage += `${message}\n`;
  }

  modalMessage += success ?
    `\nSUCCESS! All system dependencies have been installed.` :
    `\nFAILED: One or more requirement does not satisfied.`;

  if ((results?.git?.success === false || results?.bash?.success === false) && isWindows()) {
    modalMessage += '\n\nWindows users can install bash and git into $PATH by installing "git" ' +
      'and checking the "adding UNIX tools to PATH". You can achieve that by:\n' +
      '1. Installing choco\n' +
      '2. then run: choco install git.install --params "/GitAndUnixToolsOnPath"';
  }

  if (success) {
    updateCheckedRequirements(requirements);
  }

  let ignore = false;
  if (!success) {
    const options = !calledFromUser ? {
      [`Ignore and run anyway!`]: () => {
        ignore = true;
      }
    } : {};
    await projectManager.externals.showMessage.warning(modalMessage, options, { modal: true });
  }
  else if (calledFromUser) {
    await projectManager.externals.showMessage.info(modalMessage, {}, { modal: true });
  }

  if (!success && !calledFromUser && !ignore) {
    throw new Error(`[Dbux] System dependency check failed :(`);
  }
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