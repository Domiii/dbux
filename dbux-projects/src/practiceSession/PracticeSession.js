import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import Stopwatch from './Stopwatch';
import PracticeSessionState from './PracticeSessionState';
import ExerciseStatus from '../dataLib/ExerciseStatus';
import { emitSessionFinishedEvent } from '../userEvents';
import PracticeSessionData from './PracticeSessionData';
import PathwaysSession from './PathwaysSession';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PracticeSession');

/** @typedef {import('../projectLib/Project').default} Project */
/** @typedef {import('../projectLib/Exercise').default} Exercise */
/** @typedef {import('../ProjectsManager').default} ProjectsManager */

export default class PracticeSession extends PathwaysSession {
  /**
   * A PracticeSession contains the information that user solving a bug.
   * @param {Exercise} exercise 
   * @param {ProjectsManager} manager
   * @param {PracticeSessionData} sessionData
   * @param {string} [customLogFilePath]
   */
  constructor(manager, sessionId, createdAt, state, customLogFilePath, exerciseId) {
    super(manager, sessionId, createdAt, state, customLogFilePath);
    this.exerciseId = exerciseId;

    this.stopwatch = new Stopwatch(manager.externals.stopwatch);

    if (!this.progress) {
      // sanity check
      throw new Error(`Cannot find exerciseProgress when creating practiceSession of exerciseId ${exerciseId}`);
    }
  }

  get project() {
    return this.exercise.project;
  }

  get exercise() {
    return this.manager.getExerciseById(this.exerciseId);
  }

  get progress() {
    return this.bdp.getExerciseProgress(this.exerciseId);
  }

  get stopwatchEnabled() {
    return this.progress.stopwatchEnabled;
  }

  get confirmStopMessage() {
    return `You have not found the bug, are you sure?`;
  }

  /**
   * Activate bug, run the test and process the result
   * @param {Object} inputCfg 
   */
  async testExercise(inputCfg = {}) {
    const { exercise: bug } = this;
    await this.manager.switchAndTestBug(bug, inputCfg);
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
      const { solvedAt, startedAt } = this.bdp.getExerciseProgress(this.exercise.id);
      if (this.isFinished()) {
        this.stopwatch.set(solvedAt - startedAt);
      }
      else {
        this.stopwatch.set(Date.now() - startedAt);
        this.stopwatch.start();
      }
      this.stopwatch.show();
    }
  }

  async tagExerciseTrace(trace, cursorFile, cursorLine) {
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
      emitSessionFinishedEvent(this.state);
      this.setState(PracticeSessionState.Found);
      await this.manager.bdp.save();
      await this.save();
      // TOTRANSLATE
      const congratsMsg = `Congratulations!! You have found the bug!`;
      await this.manager.externals.alert(congratsMsg, true);
    }
    else if (isCorrect === false) {
      // TOTRANSLATE
      const failedMsg = `This is not the right line, keep going!`;
      const buttonConfig = {
        OK: () => { },
        "That sucks!": async () => {
          await this.manager.externals.showHelp();
        },
        Help: async () => {
          await this.manager.externals.showHelp();
        }
      };
      this.manager.externals.showMessage.info(failedMsg, buttonConfig);
    }
    else if (isCorrect === null) {
      // skip if the result is null or something else, since bug location may not been defined yet
      // TOTRANSLATE
      const failedMsg = `This exercise has no bugs.`;
      await this.manager.externals.alert(failedMsg, false);
    }
  }

  async handleStop() {
    await this.manager.stopRunner();
    this.stopwatch.pause();
  }

  /** ###########################################################################
   *  save/load
   *  #########################################################################*/

  /**
   * @returns {PracticeSessionData}
   */
  serialize() {
    const exerciseId = this.exercise.id;

    return {
      ...super.serialize(),
      exerciseId,
    };
  }

  /**
   * @param {ProjectsManager} manager
   * @param {PracticeSessionData} sessionData
   * @returns 
   */
  static from(manager, sessionData) {
    const {
      sessionId,
      createdAt,
      logFilePath,
      state,
      exerciseId,
    } = sessionData;
    return new PracticeSession(manager, sessionId, createdAt, state, logFilePath, exerciseId);
  }

  // ###########################################################################
  // utils
  // ###########################################################################

  async askToFinish() {
    const confirmString = 'You have solved the bug, do you want to stop the practice session?';
    const result = await this.manager.externals.confirm(confirmString);

    if (result) {
      await this.manager.exitPracticeSession();
    }
  }

  /**
   * @param {BugStatus} newStatus 
   */
  updateExerciseStatus(newStatus) {
    const exerciseProgress = this.bdp.getExerciseProgress(this.exercise.id);
    if (exerciseProgress.status < newStatus) {
      const update = { status: newStatus };
      if (ExerciseStatus.is.Solved(newStatus)) {
        update.solvedAt = Date.now();
      }
      this.bdp.updateExerciseProgress(this.exercise, update);
    }
  }

  /**
   * @param {Exercise} exercise 
   * @param {*} result 
   */
  async saveTestRunResult(exercise, result) {
    const patch = await exercise.project.getPatchString();
    const newApps = allApplications.selection.getAll().filter(app => !this.pdp.collections.applications.isApplicationAdded(app));
    
    // TODO: a better way to find the real application generated by the project
    // TODO: find the correct `nFailedTests`
    // this.pdp.addTestRun(bug, result?.code, patch, newApps);
    this.pdp.addTestRun(exercise, null, patch, newApps);
    // this.pdp.addApplications(newApps);
    this.bdp.updateExerciseProgress(exercise, { patch });
  }

  async save() {
    try {
      await this.manager.saveSession();
    }
    catch (err) {
      logError('Error when saving practiceSession:', err);
    }
  }
}