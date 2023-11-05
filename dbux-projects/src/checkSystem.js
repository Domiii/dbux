import merge from 'lodash/merge';
import semver from 'semver';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import { newLogger } from '@dbux/common/src/log/logger';
import { whichNormalized } from '@dbux/common-node/src/util/pathUtil';
import Process from './util/Process';
import { emitCheckSystemAction } from './userEvents/index';

/** @typedef {import('./ProjectsManager').default} ProjectsManager */

const logger = newLogger('checkSystem');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

/** ###########################################################################
 * result cache
 *  #########################################################################*/

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

/** ###########################################################################
 * check util
 *  #########################################################################*/

/**
 * Get version of `program`.
 * @param {string} programPath
 * @return {Promise<string>} semver of `program`
 */
async function getVersion(programPath) {
  const option = { failOnStatusCode: false };
  let result = await Process.execCaptureOut(`"${programPath}" --version`, option);

  return semver.valid(semver.coerce(result));
}

/**
 * Check if the current running OS is windows.
 * @return {boolean} if the windows is windows.
 */
function isWindows() {
  return process.platform === 'win32';
}

/** ###########################################################################
 * main check function
 *  #########################################################################*/

/**
 * Check system with requirements
 * future-work: don't have this depend on `dbux-projects`.
 * 
 * @param {ProjectsManager} manager
 * @param {boolean} calledFromUser Whether the function is called by user. Decides showing success message to user or not.
 * @param {boolean} fullCheck if false, skip checking `git` (or more generally: skip all projects-specific settings).
 */
export async function checkSystem(manager, requirements, calledFromUser) {
  if (!calledFromUser && isChecked(requirements)) {
    return;
  }

  let results = {};

  let success = true;
  // TOTRANSLATE
  let modalMessage = 'Dbux requires the following programs to be installed and available on your system in order to run smoothly.' +
    ' Please make sure, you have all of them installed.\n\n';

  for (let program of Object.keys(requirements)) {
    const programPath = manager.paths[program] || program;
    const result = { path: whichNormalized(programPath) };
    let message = '';
    let requirement = requirements[program];

    if (result.path) {
      if (requirement.version) {
        result.version = await getVersion(programPath);
        if (semver.satisfies(result.version, requirement.version)) {
          // TOTRANSLATE
          message += `✓  ${program}\n    found at "${result.path}" (v${result.version} satisfies ${requirement.version})`;
          result.success = true;
        }
        else {
          // TOTRANSLATE
          message += `✓⚠ ${program}\n    Installed but old. Version is ${result.version} but we recommend ${requirement.version}.`;
          result.success = false;
        }
      }
      else {
        // TOTRANSLATE
        message += `✓  ${program}\n    found at "${result.path}"`;
        result.success = true;
      }

      let customRequirement = requirement.custom;
      if (result.success && customRequirement) {
        if (!isArray(customRequirement)) {
          customRequirement = [customRequirement];
        }

        for (const customRequirementFunction of customRequirement) {
          if (isFunction(customRequirementFunction)) {
            const customResult = await customRequirementFunction?.(manager);
            if (customResult.success) {
              if (customResult.message) {
                message += `\n\t✓  ${customResult.message}`;
              }
            }
            else {
              result.success = false;

              if (customResult.message) {
                message = `x  ${program}\n    ${customResult.message}`;
              }
              else {
                warn("Custom requirement failed without message.");
                message = `x  ${program}`;
              }
              break;
            }
          }
          else {
            warn("Provided custom requirement is not a function. Skipped.");
          }
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

  if ((results?.git?.success === false) && isWindows()) {
    // // TOTRANSLATE
    // modalMessage += '\n\nGit or bash are missing. Windows users can install bash and git into $PATH by installing "git" ' +
    //   'and checking the "adding UNIX tools to PATH". You can achieve that by:\n' +
    //   '1. Installing choco\n' +
    //   '2. then run: choco install git.install --params "/GitAndUnixToolsOnPath"';
    modalMessage += '\n\nGit is missing. Windows users can install git with WinGet, choco or manually download it from the git website.';
  }

  if (success) {
    updateCheckedRequirements(requirements);
  }

  let ignore = false;
  if (!success) {
    const options = calledFromUser ?
      {
        // TOTRANSLATE
        [`Ignore and run anyway!`]: () => {
          ignore = true;
        }
      } :
      {};
    await manager.externals.showMessage.warn(modalMessage, options, { modal: true });
  }
  else if (calledFromUser) {
    await manager.externals.showMessage.info(modalMessage, {}, { modal: true });
  }
  else {
    debug(`checkSystem() result: ${modalMessage}`);
  }

  if (calledFromUser) {
    emitCheckSystemAction(success, results);
  }

  if (!success && !calledFromUser && !ignore) {
    throw new Error(`[Dbux] System dependency check failed :(`);
  }
}

/**
 * @see https://github.com/Domiii/dbux/issues/593
 */
export const DefaultNodeVersion = '>=16';
export function getDefaultRequirement(fullCheck) {
  const defaultReq = {
    shell: {},
    node: { version: DefaultNodeVersion },
    npm: {}
  };

  if (!fullCheck) {
    return defaultReq;
  }
  else {
    return {
      ...defaultReq,
      git: {
        /**
         * @param {ProjectsManager} manager 
         */
        custom: async (manager) => {
          const { git } = manager.paths;
          const gitConfig = await Process.execCaptureOut(`"${git}" config -l`);
          const configs = Object.fromEntries(gitConfig.split("\n").map(line => line.split('=')));
          const checkKeys = ["user.name", "user.email"];
          let success = true;
          let message = "";
          for (const checkKey of checkKeys) {
            if (!(checkKey in configs)) {
              success = false;

              if (message) {
                message += "\n";
              }
              message += `Can't find git config entry for "${checkKey}"`;
            }
          }
          if (success) {
            return { success };
          }
          return {
            success,
            message: `${message}\nAdd missing config entries via \`git config --global <key> <value>\`\n`,
          };
        }
      },
    };
  }
}
