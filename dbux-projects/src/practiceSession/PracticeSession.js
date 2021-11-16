import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import Stopwatch from './Stopwatch';
import PracticeSessionState from './PracticeSessionState';
import ExerciseStatus from '../dataLib/ExerciseStatus';
import { emitPracticeSessionEvent, emitSessionFinishedEvent } from '../userEvents';
import PracticeSessionData from './PracticeSessionData';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PracticeSession');

/** @typedef {import('../projectLib/Project').default} Project */
/** @typedef {import('../projectLib/Exercise').default} Exercise */
/** @typedef {import('../ProjectsManager').default} ProjectsManager */

export default class PracticeSession {
  /**
   * A PracticeSession contains the information that user solving a bug.
   * @param {Exercise} exercise 
   * @param {ProjectsManager} manager
   * @param {PracticeSessionData} sessionData
   */
  constructor(exercise, manager, sessionData, logFilePath) {
    const { createdAt, sessionId, state } = sessionData;
    this.sessionId = sessionId || uuidv4();
    this.createdAt = createdAt || Date.now();
    this.stopwatch = new Stopwatch(manager.externals.stopwatch);
    this.exercise = exercise;
    this.manager = manager;
    this.lastAnnotation = '';

    // TODO: move to `logFilePath` getter
    this.logFilePath = logFilePath || sessionData.logFilePath || this.getDefaultLogFilePath();

    let exerciseProgress = this.bdp.getExerciseProgressByExercise(exercise);
    if (!exerciseProgress) {
      throw new Error(`Can't find exerciseProgress when creating practiceSession of bug ${exercise.id}`);
    }

    // state management
    this.stopwatchEnabled = exerciseProgress.stopwatchEnabled;
    this.state = state || (ExerciseStatus.is.Solved(exerciseProgress.status) ? PracticeSessionState.Solved : PracticeSessionState.Solving);
  }

  get project() {
    return this.exercise.project;
  }

  get bdp() {
    return this.manager.bdp;
  }

  get isSolved() {
    return PracticeSessionState.is.Solved(this.state);
  }

  isFinished() {
    return this.manager.pdp.util.hasSessionFinished();
  }

  setState(state) {
    if (this.state !== state) {
      this.state = state;
      this.manager._notifyPracticeSessionStateChanged();
    }
  }

  /**
   * Activate bug, run the test and process the result
   * @param {Object} inputCfg 
   */
  async testExercise(inputCfg = EmptyObject) {
    const { exercise: bug } = this;
    const result = await this.manager.switchAndTestBug(bug, inputCfg);
    // this.maybeUpdateBugStatusByResult(result);

    // NOTE: `BugRunner.testBug` returns invalid code, disable the function for now
    this.manager._emitter.emit('bugStatusChanged', bug);
    // if (bug.bugLocations) {
    //   if (BugStatus.is.Solved(this.manager.getResultStatus(result))) {
    //     // user passed all tests
    //     this.setState(PracticeSessionState.Solved);
    //     emitPracticeSessionEvent('solved', this);
    //     this.stopwatch.pause();
    //     // await this.manager.askForSubmit();
    //     await this.askToFinish();
    //   }
    //   else if (result?.code) {
    //     this.manager.externals.alert(`Test(s) failed (code = ${result?.code}). Keep going! :)`);
    //   }
    // }
    // else: errored out + already reported
    await this.save();
    await this.bdp.save();
  }

  /**
   * Giveup the timed challenge
   */
  giveup() {
    if (this.stopwatchEnabled) {
      this.bdp.updateExerciseProgress(this.exercise, { stopwatchEnabled: false });
      this.stopwatchEnabled = false;
      this.stopwatch.pause();
      this.stopwatch.hide();
    }
  }

  setupStopwatch() {
    if (this.stopwatchEnabled) {
      const { solvedAt, startedAt } = this.bdp.getExerciseProgressByExercise(this.exercise);
      if (this.isSolved) {
        this.stopwatch.set(solvedAt - startedAt);
      }
      else {
        this.stopwatch.set(Date.now() - startedAt);
        this.stopwatch.start();
      }
      this.stopwatch.show();
    }
  }

  tagBugTrace(trace, cursorFile, cursorLine) {
    if (this.isFinished()) {
      const alertsMsg = `Practice session aleady finished.`;
      this.manager.externals.alert(alertsMsg);
      return;
    }

    const { applicationId, traceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const location = {
      fileName: dp.util.getTraceFilePath(traceId),
      line: dp.util.getTraceLoc(traceId).start.line,
    };

    if (cursorFile !== location.fileName || cursorLine !== location.line) {
      const alertsMsg = `Place cursor on selected trace and try again. (This is to prevent accidentally flagging the wrong line.)`;
      this.manager.externals.alert(alertsMsg);
      return;
    }

    const isCorrect = this.exercise.isCorrectBugLocation(location);
    if (isCorrect) {
      this.manager.bdp.updateExerciseProgress(this.exercise, { status: ExerciseStatus.Found });
      this.setState(PracticeSessionState.Found);
      emitSessionFinishedEvent(this.state);
      this.save();
      this.manager.bdp.save();
      // TOTRANSLATE
      const congratsMsg = `Congratulations!! You have found the bug!`;
      this.manager.externals.alert(congratsMsg, true);
    }
    else if (isCorrect === false) {
      // TOTRANSLATE
      const failedMsg = `This is not the right line, keep going!`;
      this.manager.externals.alert(failedMsg, false);
    }
    else if (isCorrect === null) {
      // skip if the result is null or something else, since bug location may not been defined yet
      // TOTRANSLATE
      const failedMsg = `This exercise has no bugs.`;
      this.manager.externals.alert(failedMsg, false);
    }
  }

  /**
   * Stop practicing, but not quit session
   */
  async confirmStop() {
    if (this.isFinished()) {
      return true;
    }

    if (!await this.manager.externals.confirm(`You have not found the bug, are you sure?`)) {
      return false;
    }

    await this.manager.stopRunner();
    this.stopwatch.pause();
    this.setState(PracticeSessionState.Stopped);
    emitSessionFinishedEvent(this.state);
    await this.save();

    return true;
  }

  async confirmExit() {
    if (!await this.manager.externals.confirm(`Do you want to exit the practice session?`)) {
      return false;
    }

    if (this.stopwatchEnabled) {
      if (!PracticeSessionState.is.Solved(this.state)) {
        this.giveup();
        await this.manager.bdp.save();
      }
      this.stopwatch.pause();
      this.stopwatch.hide();
    }

    allApplications.clear();

    this.manager.practiceSession = null;

    await this.save();

    // emitPracticeSessionEvent('stopped', practiceSession);
    this.manager.pdp.reset();
    this.manager._notifyPracticeSessionStateChanged();
    return true;
  }

  // ###########################################################################
  // utils
  // ###########################################################################

  getDefaultLogFilePath() {
    return this.manager.getPathwaysLogFilePath(this.sessionId);
  }

  async askToFinish() {
    const confirmString = 'You have solved the bug, do you want to stop the practice session?';
    const result = await this.manager.externals.confirm(confirmString);

    if (result) {
      await this.manager.stopPractice();
    }
  }

  /**
   * @param {Object} result 
   * @param {number} result.code
   */
  maybeUpdateBugStatusByResult(result) {
    const newStatus = this.manager.getResultStatus(result);

    this.updateBugStatus(newStatus);
  }

  /**
   * @param {BugStatus} newStatus 
   */
  updateBugStatus(newStatus) {
    const exerciseProgress = this.bdp.getExerciseProgressByExercise(this.exercise);
    if (exerciseProgress.status < newStatus) {
      const update = { status: newStatus };
      if (ExerciseStatus.is.Solved(newStatus)) {
        update.solvedAt = Date.now();
      }
      this.bdp.updateExerciseProgress(this.exercise, update);
    }
  }

  async save() {
    try {
      await this.manager.savePracticeSession();
    }
    catch (err) {
      logError('Error when saving practiceSession:', err);
    }
  }
}