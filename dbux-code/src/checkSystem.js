import semver from 'semver';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import { newLogger } from '@dbux/common/src/log/logger';
import { whichNormalized } from '@dbux/common-node/src/util/pathUtil';
import Process from '../../dbux-projects/src/util/Process';
import { confirm, showInformationMessage, showWarningMessage } from './codeUtil/codeModals';

/** @typedef {import('../../dbux-projects/src/ProjectsManager').default} ProjectsManager */

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
 * @param {string} program 
 * @return {Promise<string>} semver of `program`
 */
async function getVersion(program) {
  const option = { failOnStatusCode: false };
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

/** ###########################################################################
 * {@link checkSystem}
 *  #########################################################################*/

/**
 * Check system with requirements
 * @param {object | boolean} requirements
 * @param {boolean} calledFromUser Whether the function is called by user. Decides showing success message to user or not.
 */
export default async function checkSystem(requirements, calledFromUser, moreRequirements) {
  if (!isObject(requirements)) {
    // requirements is a bool
    requirements = getDefaultRequirements(!!requirements);
  }
  if (moreRequirements) {
    requirements = {
      ...requirements,
      ...moreRequirements
    };
  }

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
          message += `✓  ${program}\n    found at "${result.path}" (v${result.version} satisfies ${requirement.version})`;
          result.success = true;
        }
        else {
          // TOTRANSLATE
          // ¯\\_(ツ)_/¯
          message += `x ${program}\n    Installed but old. Your installed version is ${result.version} but we recommend ${requirement.version}.`;
          if (program === 'node') {
            // eslint-disable-next-line max-len
            message += `\n      NOTE: we strongly recommend volta (https://volta.sh/) for managing Node versions.\n      It is cross-platform and has several features that nvm and n do not have (as of Jan 2022).`;
          }
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
            const customResult = await customRequirementFunction?.();
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
    // always allow user
    const options = //calledFromUser ?
    {
      // TOTRANSLATE
      [`Ignore WARNING and run anyway!`]: () => {
        ignore = true;
      }
    };
    // : {};
    await showWarningMessage(modalMessage, options, { modal: true });
  }
  else if (calledFromUser) {
    await showInformationMessage(modalMessage, {}, { modal: true });
  }
  else {
    debug(`checkSystem() result: ${modalMessage}`);
  }

  if (!success) {
    if (!ignore) {
      throw new Error(`[Dbux] System dependency check failed :(`);
    }
    else {
      if (!await confirm(`[Dbux] System dependency check failed, but running anyway. Are you sure?`)) {
        throw new Error(`[Dbux] System dependency check failed :(`);
      }
    }
  }
}

/** ###########################################################################
 * {@link getDefaultRequirements}
 * ##########################################################################*/

/**
 * @see https://github.com/Domiii/dbux/issues/593
 */
const DefaultNodeVersion = '16';


export function getDefaultRequirements(fullCheck) {
  const baseReqs = {
    node: { version: DefaultNodeVersion },
    npm: {},
  };
  if (!fullCheck) {
    return baseReqs;
  }
  else {
    return {
      ...baseReqs,

      bash: {},
      git: {
        custom: async () => {
          const gitConfig = await Process.execCaptureOut(`git config -l`);
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
              message += `Can't find git config with key ${checkKey}`;
            }
          }
          if (success) {
            return { success };
          }
          return {
            success,
            message: `${message}\nAdd these config via \`git config --global <key> <value>\`\n`,
          };
        }
      },
    };
  }
}
