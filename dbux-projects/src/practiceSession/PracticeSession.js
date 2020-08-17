import Stopwatch from './Stopwatch';
import PracticeSessionState from './PracticeSessionState';

/** @typedef {import('../projectLib/Project').default} Project */
/** @typedef {import('../projectLib/Bug').default} Bug */

export default class PracticeSession {
  /**
   * A PracticeSession contains the information that user solving a bug of project.
   * @param {Project} project 
   * @param {Bug} bug 
   */
  constructor(project, bug, stopwatchEnabled = false) {
    this._stopwatch = new Stopwatch();
    this.stopwatchEnabled = stopwatchEnabled;
    this.project = project;
    this.bug = bug;
    this.state = PracticeSessionState.Activating;
  }

  setState(state) {
    this.state = state;
  }

  get time() {
    return this._stopwatch.time;
  }

  startStopwatch() {
    this.checkStopwatchEnabled();
    this._stopwatch.start();
  }

  /**
   * @param {number} time 
   */
  setStopwatch(time) {
    this.checkStopwatchEnabled();
    this._stopwatch.set(time);
  }

  /**
   * @param {number} time 
   */
  stopStopwatch() {
    this.checkStopwatchEnabled();
    this._stopwatch.pause();
    return this._stopwatch.time;
  }

  checkStopwatchEnabled() {
    if (!this.stopwatchEnabled) {
      throw new Error('Stopwatch does not enabled in this practice session');
    }
  }
}