/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

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
    addHook();
    projectsManager.onPracticeSessionStateChanged(addHook);
  }
}

let sessionId, prevListener;

function addHook(session) {
  if (sessionId !== session?.sessionId) {
    // stop listening on previous events
    prevListener?.();

    prevListener = session?.pdp.onAnyData(addData);
  }
}

function addData(allData) {
  for (const collectionName of Object.keys(allData)) {
    // TODO-M: push data into buffer
  }
}