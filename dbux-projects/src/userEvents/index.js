import NanoEvents from 'nanoevents';

/** @typedef {import('../practiceSession/PracticeSession').default} PracticeSession */
/** @typedef {import('../ProjectsManager').default} ProjectsManager */

// ###########################################################################
// register ProjectsManager
// ###########################################################################

/**
 * @type {ProjectsManager}
 */
let manager;

export function initUserEvent(_manager) {
  manager = _manager;
}

// ###########################################################################
// event registry
// ###########################################################################

/**
 * @param {string} eventName
 * @param {PracticeSession} practiceSession 
 */
export function emitPracticeSessionEvent(eventName, practiceSession) {
  emitUserEvent(`practiceSession.${eventName}`, {
    sessionId: practiceSession.sessionId,
    bugId: practiceSession.bug.id
  });
}

export function emitNewTestRun(testRun) {
  emitUserEvent('testRunFinished', { testRun });
}

export function emitNewBugProgress(bugProgress) {
  emitUserEvent('newBugProgress', { bugProgress });
}

export function emitBugProgressChanged(bugProgress) {
  emitUserEvent('bugProgressChanged', { bugProgress });
}

// ###########################################################################
// emitter
// ###########################################################################

const emitter = new NanoEvents();

/**
 * Callback for adding two numbers.
 *
 * @callback onUserEventCb
 * @param {UserEvent} e
 */

/**
 * @typedef {Object} UserEvent
 * @property {string} name
 * @property {string} sessionId
 * @property {string} bugId
 * @property {Object} data
 * @property {number} createdAt
 */

/**
 * @param {onUserEventCb} cb
 */
export function onUserEvent(cb) {
  return emitter.on('e', cb);
}

/**
 * @param {string} eventName 
 * @param {Object} data NOTE: data *must* always be completely serializable, simple data.
 */
export function emitUserEvent(eventName, data) {
  if (manager.practiceSession) {
    emitter.emit('e', {
      name: eventName,
      sessionId: manager.practiceSession.sessionId,
      bugId: manager.practiceSession.bug.id,
      createdAt: Date.now(),
      data
    });
  }
}