import NanoEvents from 'nanoevents';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';

/** @typedef {import('../practiceSession/PracticeSession').default} PracticeSession */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserEvents');

// const Verbose = true;
const Verbose = false;

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
    exerciseId: practiceSession.exerciseId
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

export function emitCheckSystemAction(success, result) {
  emitUserEvent(UserActionType.CheckSystem, { success, result });
}

export function emitNewApplicationsAction(apps = EmptyArray) {
  const uuids = apps.map(app => app.uuid);
  emitUserEvent(UserActionType.NewApplications, { uuids });
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

if (Verbose) {
  onUserEvent((evt) => {
    const { type, createdAt, ...evtData } = evt;
    const typeName = UserActionType.nameFromForce(type);
    log(`Emit user event "${typeName}", additional data=${JSON.stringify(evtData)}`);
  });
}