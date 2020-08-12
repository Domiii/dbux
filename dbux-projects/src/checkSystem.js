
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
    let result = await Process.execCaptureAll(`cyygpath -w ${path}`, option);
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
    wshich: {},
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

  // debug(requirement, results);

  let success = true;
  let modalMessage = '';

  for (let program of Object.keys(requirement)) {
    let message = 'Dbux requires the following programs to be installed and available on your system in order to run smoothly. Please make sure, you have all of them installed.\n';

    let req = requirement[program];
    let res = results[program];

    if (res?.path && (!req.version || res.version >= req.version)) {
      message += `✓  ${program}\n    Found at "${res.path}"` + (req.version ? ` (v${res.version} >= ${req.version})` : ``);
    } else if (res?.path) {
      // eslint-disable-next-line max-len
      message += `¯\\_(ツ)_/¯ ${program} installed but old. Version is ${res.version} but we recommend ${req.version}. Your version might or might not work. We don't know, but we recommend upgrading to latest (or at least a later) version instead.`;
      // success = false;
    } else {
      message += `x   ${program} not found.`;
      success = false;
    }

    modalMessage += `${message}\n`;
  }

  modalMessage += success ? 
    `\nSUCCESS! All system dependencies seem to be in order.` : 
    `\nPROBLEM: One or more system dependencies are not installed. Fix them then try again.`;

  debug(success, modalMessage);

  if (!success || calledFromUser) {
    if (success) await projectManager.externals.showMessage.info(modalMessage, {}, { modal: true });
    else await projectManager.externals.showMessage.warning(modalMessage, {}, { modal: true });
  }

  if (!success && !calledFromUser) {
    throw new Error(`[DBUX] System dependency check failed :(`);
  }

  await updateCheckedStatus(projectManager, success);
}