import merge from 'lodash/merge';
import semver from 'semver';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import { newLogger } from '@dbux/common/src/log/logger';
import { whichNormalized } from '@dbux/common-node/src/util/pathUtil';
import Process from './util/Process';

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
  // TOTRANSLATE
  let modalMessage = 'Dbux requires the following programs to be installed and available on your system in order to run smoothly.' +
    ' Please make sure, you have all of them installed.\n\n';

  for (let program of Object.keys(requirements)) {
    const result = { path: whichNormalized(program) };
    let message = '';
    let requirement = requirements[program];

    if (result.path) {
      if (requirement.version) {
        result.version = await getVersion(program);
        if (semver.satisfies(result.version, requirement.version)) {
          // TOTRANSLATE
          message += `✓  ${program}\n    Found at "${result.path}" (v${result.version} satisfies ${requirement.version})`;
          result.success = true;
        }
        else {
          // TOTRANSLATE
          message += `¯\\_(ツ)_/¯ "${program}"\n    Installed but old. Version is ${result.version} but we recommend ${requirement.version}.`;
          result.success = false;
        }
      }
      else {
        // TOTRANSLATE
        message += `✓  ${program}\n    Found at "${result.path}"`;
        result.success = true;
      }
      
      const customRequirement = requirement.custom;
      if (customRequirement) {
        if (isArray(customRequirement)) {
          for (const customRequirementFunction of customRequirement) {
            if (isFunction(customRequirementFunction)) {
              const customResult = await customRequirementFunction?.();
              message += `${customResult}\n`;
            } else {
              warn("Provided custom requirement is not a function");
            }
          }
        } else if (isFunction(customRequirement)) {
          try {
            const customResult = await customRequirement?.();
            message += `\n✓  ${customResult}`;
          } catch (e) {
            message += `\nx  ${e.message}`;
          }
        } else {
          warn("Provided custom requirement is not a function");
        }
      }
    }
    else {
      // TOTRANSLATE
      message += `x  ${program}\n    Not found.`;
      result.success = false;
    }

    if (!result.success) {
      success = false;
    }

    modalMessage += `${message}\n`;
  }

  // TOTRANSLATE
  modalMessage += success ?
    `\nSUCCESS! All system dependencies seem to be in order.` :
    `\nFAILED: One or more system dependencies are not installed. Fix them, then try again.`;

  if ((results?.git?.success === false || results?.bash?.success === false) && isWindows()) {
    // TOTRANSLATE
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
      // TOTRANSLATE
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
      git: {
        custom: async () => {
          const gitConfig = await Process.execCaptureOut(`git config -l`);
          const configs = Object.fromEntries(gitConfig.split("\n").map(line => line.split('=')));
          const checkKeys = ["user.name", "user.email"];
          for (const checkKey of checkKeys) {
            if (!(checkKey in configs)) {
              throw new Error(`Can't find git config with key ${checkKey}`);
            }
          }
          return "Found all required configs";
        }
      },
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