
import { newLogger } from '@dbux/common/src/log/logger';
import Process from './util/Process';
import which, { hasWhich } from './util/which';

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

async function check(program) {
  try {
    let path = await which(program);
    return { path };
  } catch (err) {
    return {};
  }
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
    bash: {},
    node: { version: 12 },
    npm: {},
    git: {},
  };
  let results = {};

  let success = true;
  let modalMessage = 'Dbux requires the following programs to be installed and available on your system in order to run smoothly. Please make sure, you have all of them installed.\n\n';

  if (await hasWhich()) {
    for (let program of Object.keys(requirement)) {
      results[program] = await check(program);
    }

    results.node.path && (results.node.version = await getNodeVersion());
    
    modalMessage += `✓  which/where.exe\n`;
  } else {
    success = false;
    modalMessage += `x  which/where.exe\n    Dbux requires at least one of these two programs to check following programs, but we can't find any in your system. Please try fixing this problem and try again.\n`;
  }

  // debug(requirement, results);

  for (let program of Object.keys(requirement)) {
    let message = '';

    let req = requirement[program];
    let res = results[program];

    if (res?.path && (!req.version || res.version >= req.version)) {
      message += `✓  ${program}\n    Found at "${res.path}"` + (req.version ? ` (v${res.version} >= ${req.version})` : ``);
    } else if (res?.path) {
      // eslint-disable-next-line max-len
      message += `¯\\_(ツ)_/¯ ${program} installed but old. Version is ${res.version} but we recommend ${req.version}. Your version might or might not work. We don't know, but we recommend upgrading to latest (or at least a later) version instead.`;
      // success = false;
    } else if (res) {
      message += `x    ${program} not found.`;
      success = false;
    } else {
      message += `?    ${program} not tested.`;
      success = false;
    }

    modalMessage += `${message}\n`;
  }

  modalMessage += success ? 
    `\nSUCCESS! All system dependencies seem to be in order.` : 
    `\nPROBLEM: One or more system dependencies are not installed. Fix them then try again.`;

  // debug(success, modalMessage);

  if (!success || calledFromUser) {
    if (success) await projectManager.externals.showMessage.info(modalMessage, {}, { modal: true });
    else await projectManager.externals.showMessage.warning(modalMessage, {}, { modal: true });
  }

  if (!success && !calledFromUser) {
    throw new Error(`[DBUX] System dependency check failed :(`);
  }

  await updateCheckedStatus(projectManager, success);
}