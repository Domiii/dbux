import NanoEvents from 'nanoevents';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';

/** @typedef {import('@dbux/data/src/pathways/UserAction').default} UserAction */
/** @typedef {import('../practiceSession/PracticeSession').default} PracticeSession */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserActions');

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
  emitUserAction(UserActionType.PracticeSessionChanged, {
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
  emitUserAction(UserActionType.SessionFinished, { state, createdAt });
}

export function emitNewTestRun(testRun) {
  emitUserAction(UserActionType.TestRunFinished, {
    testRun,
    // new test run always introduces a new step
    // newStep: true
  });
}

export function emitNewExerciseProgress(exerciseProgress) {
  emitUserAction(UserActionType.NewExerciseProgress, { exerciseProgress });
}

export function emitExerciseProgressChanged(exerciseProgress) {
  emitUserAction(UserActionType.ExerciseProgressChanged, { exerciseProgress });
}

export function emitCheckSystemAction(success, result) {
  emitUserAction(UserActionType.CheckSystem, { success, result });
}

export function emitNewApplicationsAction(apps = EmptyArray) {
  const uuids = apps.map(app => app.uuid);
  emitUserAction(UserActionType.NewApplications, { uuids });
}

// ###########################################################################
// emitter
// ###########################################################################

/**
 * @type {NanoEvents}
 */
const emitter = new NanoEvents();

/**
 * @callback onUserEventCb
 * @param {UserAction} e
 */

/**
 * @param {onUserEventCb} cb
 */
export function onUserAction(cb) {
  return emitter.on('e', cb);
}

/**
 * @param {number} eventType 
 * @param {Object} eventData NOTE: data *must* always be completely serializable, simple data.
 */
export function emitUserAction(eventType, eventData) {
  emitter.emit('e', {
    type: eventType,
    createdAt: Date.now(),
    ...eventData
  });
}

if (Verbose) {
  onUserAction((userAction) => {
    const { type, createdAt, ...evtData } = userAction;
    const typeName = UserActionType.nameFromForce(type);
    log(`Event "${typeName}", data=${JSON.stringify(evtData)}`);
  });
}