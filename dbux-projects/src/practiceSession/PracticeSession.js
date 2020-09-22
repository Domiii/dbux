import Stopwatch from './Stopwatch';
import PracticeSessionState from './PracticeSessionState';
import BugStatus from '../dataLib/BugStatus';

/** @typedef {import('../projectLib/Project').default} Project */
/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('../ProjectsManager').default} ProjectsManager */

export default class PracticeSession {
  /**
   * A PracticeSession contains the information that user solving a bug.
   * @param {Bug} bug 
   * @param {ProjectsManager} manager
   */
  constructor(bug, manager) {
    this.stopwatch = new Stopwatch(manager.externals.stopwatch);
    this.project = bug.project;
    this.bug = bug;
    this.manager = manager;
    
    let bugProgress = this.plc.util.getBugProgressByBug(bug);
    if (!bugProgress) {
      throw new Error(`Can't find bugProgress when creating practiceSession of bug ${bug.id}`);
    }
    
    // state management
    this.stopwatchEnabled = bugProgress.stopwatchEnabled;
    this.state = BugStatus.is.Solved(bugProgress.status) ? PracticeSessionState.Solved : PracticeSessionState.Solving;
    
    // set stopwatch
    const { startedAt } = bugProgress;
    this.stopwatch.set(Date.now() - startedAt);
  }

  get plc() {
    return this.manager.plc;
  }

  setState(state) {
    this.state = state;
  }

  /**
   * Activate bug of and process the result
   * @param {boolean} debugMode 
   */
  async activate(debugMode) {
    const { bug } = this;
    const result = await this.manager._activateBug(bug, debugMode);
    this.maybeUpdateBugStatusByResult(result);
    
    if (this.manager.getResultStatus(result) === BugStatus.Solved) {
      // user passed all tests
      this.setState(PracticeSessionState.Solved);
      await this.manager.askForSubmit();
    }
    else {
      // some test failed
      await this.externals.alert(`[Dbux] ${result.code} test(s) failed. Try again!`);
    }
    await this.plc.save();
    this.manager._emitter.emit('bugStatusChanged', bug);
  }

  /**
   * Giveup the timed challenge
   */
  giveup() {
    this.plc.updateBugProgress(this.bug, { stopwatchEnabled: false });
    this.stopwatchEnabled = false;
    this.stopwatch.pause();
    this.stopwatch.hide();
  }

  // ###########################################################################
  // utils
  // ###########################################################################

  /**
   * @param {Object} result 
   * @param {number} result.code
   */
  maybeUpdateBugStatusByResult(result) {
    const newStatus = this.manager.getResultStatus(result);
    const bugProgress = this.plc.util.getBugProgressByBug(this.bug);
    if (bugProgress.status < newStatus) {
      this.plc.updateBugProgress(this.bug, newStatus);
    }
  }
}