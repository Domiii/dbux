import NanoEvents from 'nanoevents';
import UserActionType from '@dbux/data/src/pathways/UserActionType';

/** @typedef {import('../practiceSession/PracticeSession').default} PracticeSession */

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
    exerciseId: practiceSession.exercise.id
  });
}

/**
 * 
 * @param {number} [createdAt] hackfix to override the time
 */
export function emitSessionFinishedEvent(state, createdAt) {
  emitUserEvent(UserActionType.SessionFinished, { state, createdAt });
}

export function emitNewTestRun(testRun) {
  emitUserEvent(UserActionType.TestRunFinished, {
    testRun,
    // new test run always introduces a new step
    // newStep: true
  });
}

export function emitNewExerciseProgress(exerciseProgress) {
  emitUserEvent(UserActionType.NewExerciseProgress, { exerciseProgress });
}

export function emitExerciseProgressChanged(exerciseProgress) {
  emitUserEvent(UserActionType.ExerciseProgressChanged, { exerciseProgress });
}

// ###########################################################################
// emitter
// ###########################################################################

/**
 * @type {NanoEvents}
 */
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
 * @property {string} exerciseId
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
  emitter.emit('e', {
    type: eventType,
    createdAt: Date.now(),
    ...evtData
  });
}