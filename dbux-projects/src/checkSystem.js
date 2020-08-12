
import fs from 'fs';
import { newLogger } from '@dbux/common/src/log/logger';
import Process from './util/Process';

/** @typedef {import('../../dbux-projects/src/ProjectsManager').default} ProjectManager */

const logger = newLogger('checkSystem');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

const keyName = "dbux.project.systemCheck";
const option = { failOnStatusCode: false };

/**
 * @param {ProjectManager} manager 
 */
async function updateCheckedStatus(manager, status) {
  return await manager.externals.storage.set(keyName, status);
}

/**
 * @param {ProjectManager} manager 
 */
function isChecked(manager) {
  return manager.externals.storage.get(keyName, false);
}

async function canCheck() {
  let result = await Process.execCaptureAll(`which -v`, option);
  return !result.code;
}

async function getRealPath(path) {
  try {
    let realPath = fs.realpathSync(path);
    return realPath;
  } catch (err) {
    debug('get real path get err', err);
    let result = await Process.execCaptureAll(`cygpath -w ${path}`);
    return result.code ? '' : result.out;
  }
}

async function check(program) {
  let result = await Process.execCaptureOut(`which ${program}`, option);

  if (result === '') return {};

  let path = await getRealPath(result);
  if (!path) return {};
  else return { path };
}

async function getNodeVersion() {
  let result = await Process.execCaptureOut(`node -v`, option);

  let matchResult = result.match(/v(\d*)/);
  return matchResult ? parseInt(matchResult[1], 10) : 0;
}

/**
 * 
 * @param {ProjectManager} projectManager 
 * @param {boolean} calledFromUser 
 */
export async function checkSystem(projectManager, calledFromUser = false) {
  if (!calledFromUser && isChecked(projectManager)) return;

  const requirement = {
    which: {},
    bash: {},
    node: { version: 12 },
    npm: {},
    git: {},
  };
  let results = {};

  if (await canCheck()) {
    for (let program of Object.keys(requirement)) {
      results[program] = await check(program);
    }

    results.node.path && (results.node.version = await getNodeVersion());
  }

  debug(requirement, results);

  let success = true;
  let modalMessage = '';

  for (let program of Object.keys(requirement)) {
    let message = '';

    let req = requirement[program];
    let res = results[program];

    if (res?.path && (!req.version || res.version >= req.version)) {
      message += `O ${program} installed. (path: ${res.path})` + (req.version ? `(version ${res.version} >= required ${req.version})` : ``);
    } else if (res?.path) {
      message += `X ${program} installed but is too old. Version is ${res.version} but require ${req.version}.`;
      success = false;
    } else {
      message += `X ${program} not found.`;
      success = false;
    }

    modalMessage += `${message}\n`;
  }

  modalMessage += success ? 
    `All dependencies are installed. Check successed.` : 
    `One or more dependencies are not installed. Fix this then try again.`;

  debug(success, modalMessage);

  if (!success || calledFromUser) {
    if (success) projectManager.externals.showMessage.info(modalMessage, {}, { modal: true });
    else projectManager.externals.showMessage.warning(modalMessage, {}, { modal: true });
  }

  if (!success && !calledFromUser) {
    throw new Error(`System dependency check failed.`);
  }

  updateCheckedStatus(projectManager, success);
}