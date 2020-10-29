import { v4 as uuidv4 } from 'uuid';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import Stopwatch from './Stopwatch';
import PracticeSessionState, { isStateFoundedType } from './PracticeSessionState';
import BugStatus from '../dataLib/BugStatus';
import { emitPracticeSessionEvent, emitSessionFinishedEvent } from '../userEvents';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PracticeSession');

/** @typedef {import('../projectLib/Project').default} Project */
/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('../ProjectsManager').default} ProjectsManager */

export default class PracticeSession {
  /**
   * A PracticeSession contains the information that user solving a bug.
   * @param {Bug} bug 
   * @param {ProjectsManager} manager
   */
  constructor(bug, manager, { createdAt, sessionId, state }) {
    this.sessionId = sessionId || uuidv4();
    this.createdAt = createdAt || Date.now();
    this.stopwatch = new Stopwatch(manager.externals.stopwatch);
    this.project = bug.project;
    this.bug = bug;
    this.manager = manager;
    this.lastAnnotation = '';

    let bugProgress = this.bdp.getBugProgressByBug(bug);
    if (!bugProgress) {
      throw new Error(`Can't find bugProgress when creating practiceSession of bug ${bug.id}`);
    }

    // state management
    this.stopwatchEnabled = bugProgress.stopwatchEnabled;
    this.state = state || (BugStatus.is.Solved(bugProgress.status) ? PracticeSessionState.Solved : PracticeSessionState.Solving);
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
      this.manager._emitter.emit('practiceSessionChanged');
    }
  }

  /**
   * Activate bug of and process the result
   * @param {Object} inputCfg 
   */
  async activate(inputCfg = EmptyObject) {
    const { bug } = this;
    const result = await this.manager.activateBug(bug, inputCfg);
    this.maybeUpdateBugStatusByResult(result);
    this.manager._emitter.emit('bugStatusChanged', bug);

    if (BugStatus.is.Solved(this.manager.getResultStatus(result))) {
      // user passed all tests
      this.setState(PracticeSessionState.Solved);
      emitPracticeSessionEvent('solved', this);
      this.stopwatch.pause();
      // await this.manager.askForSubmit();
      await this.askToFinish();
    }
    else if (result?.code) {
      this.manager.externals.alert(`[Dbux] ${result?.code} test(s) failed. Keep going! :)`);
    }
    // else: errored out + already reported
    await this.save();
    await this.bdp.save();
  }

  /**
   * Giveup the timed challenge
   */
  giveup() {
    if (this.stopwatchEnabled) {
      this.bdp.updateBugProgress(this.bug, { stopwatchEnabled: false });
      this.stopwatchEnabled = false;
      this.stopwatch.pause();
      this.stopwatch.hide();
    }
  }

  setupStopwatch() {
    if (this.stopwatchEnabled) {
      const { solvedAt, startedAt } = this.bdp.getBugProgressByBug(this.bug);
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

  tagBugTrace(trace) {
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

    if (this.bug.isCorrectBugLocation(location)) {
      this.manager.bdp.updateBugProgress(this.bug, { status: BugStatus.Found });
      this.setState(PracticeSessionState.Found);
      emitSessionFinishedEvent(this.state);
      this.save();
      this.manager.bdp.save();
      // TOTRANSLATE
      const congratsMsg = `Congratulations!! You have found the bug!`;
      this.manager.externals.alert(congratsMsg, true);
    }
    else {
      // TOTRANSLATE
      const failedMsg = `This is not the right line, keep going!`;
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

    if (!await this.manager.externals.confirm(`You have not found the bug, are you sure?`, true)) {
      return false;
    }

    this.stopwatch.pause();
    this.setState(PracticeSessionState.Stopped);
    emitSessionFinishedEvent(this.state);
    this.save();

    return true;
  }

  async confirmExit(dontRefreshView) {
    if (!await this.manager.externals.confirm(`Do you want to exit the practice session?`, true)) {
      return false;
    }

    await this.manager.stopRunner();

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
    this.manager._emitter.emit('practiceSessionChanged'/*, dontRefreshView */);
    return true;
  }

  // ###########################################################################
  // utils
  // ###########################################################################

  async askToFinish() {
    const confirmString = 'You have solved the bug, do you want to stop the practice session?';
    const result = await this.manager.externals.confirm(confirmString, true);

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
    const bugProgress = this.bdp.getBugProgressByBug(this.bug);
    if (bugProgress.status < newStatus) {
      const update = { status: newStatus };
      if (BugStatus.is.Solved(newStatus)) {
        update.solvedAt = Date.now();
      }
      this.bdp.updateBugProgress(this.bug, update);
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