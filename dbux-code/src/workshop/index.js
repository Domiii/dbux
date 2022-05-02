/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

import NestedError from '@dbux/common/src/NestedError';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';
import { initPathwaysDataContainer } from './PathwaysDataContainer';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('WorkshopSession');

// const Verbose = true;
const Verbose = false;

const ValidCodes = new Set([]);
let currentCode = '';

if (process.env.NODE_ENV === 'development') {
  ValidCodes.add('1234');
}

/**
 * @param {string} code 
 * @returns {boolean}
 */
export function isValidCode(code) {
  return ValidCodes.has(code);
}

export function isWorkshopSessionActive() {
  return !!currentCode;
}

export function setupWorkshopSession(code) {
  if (isValidCode(code)) {
    currentCode = code;
  }
  else {
    throw new Error('Invalid workshop code');
  }
}

/** ###########################################################################
 * pdp listener and log writing
 *  #########################################################################*/

/**
 * @param {ProjectsManager} projectsManager 
 * @returns 
 */
export async function initWorkshopSession(projectsManager) {
  if (isWorkshopSessionActive()) {
    const pathwaysDataContainer = initPathwaysDataContainer();
    projectsManager.onPracticeSessionStateChanged(pathwaysDataContainer.onSessionChanged);
    scheduleUpload(pathwaysDataContainer);
  }
}

const UploadLoopInterval = 2 * 60 * 1000;
// const UploadLoopInterval = 10 * 1000;

async function scheduleUpload(pathwaysDataContainer) {
  while (isWorkshopSessionActive()) {
    await sleep(UploadLoopInterval);
    try {
      await pathwaysDataContainer.maybeFlushAll();
    }
    catch (err) {
      throw new NestedError(`Failed in PathwaysDataContainer upload loop`, err);
    }
  }
}
