import NanoEvents from 'nanoevents';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { isStateFoundedType } from '../practiceSession/PracticeSessionState';

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
  onUserEvent((data) => {
    manager.pdp.addNewUserAction(data);
  });
}

// ###########################################################################
// event registry
// ###########################################################################

/**
 * @param {string} eventName
 * @param {PracticeSession} practiceSession 
 */
export function emitPracticeSessionEvent(eventName, practiceSession) {
  emitUserEvent(UserActionType.PracticeSessionChanged, {
    eventType: eventName,
    sessionId: practiceSession.sessionId,
    bugId: practiceSession.bug.id
  });
}

export function emitNewTestRun(testRun) {
  emitUserEvent(UserActionType.TestRunFinished, { 
    testRun
  });
}

export function emitNewBugProgress(bugProgress) {
  emitUserEvent(UserActionType.NewBugProgress, { bugProgress });
}

export function emitBugProgressChanged(bugProgress) {
  emitUserEvent(UserActionType.BugProgressChanged, { bugProgress });
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
 * @param {number} eventType 
 * @param {Object} evtData NOTE: data *must* always be completely serializable, simple data.
 */
export function emitUserEvent(eventType, evtData) {
  if (manager.practiceSession && !isStateFoundedType(manager.practiceSession.state)) {
    emitter.emit('e', {
      type: eventType,
      sessionId: manager.practiceSession.sessionId,
      bugId: manager.practiceSession.bug.id,
      createdAt: Date.now(),
      ...evtData
    });
  }
}