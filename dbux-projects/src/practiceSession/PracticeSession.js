import Stopwatch from './Stopwatch';
import PracticeSessionState from './PracticeSessionState';

/** @typedef {import('../projectLib/Project').default} Project */
/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('../ProjectsManager').default} ProjectsManager */

export default class PracticeSession {
  /**
   * A PracticeSession contains the information that user solving a bug of project.
   * @param {Project} project 
   * @param {Bug} bug 
   * @param {ProjectsManager} 
   */
  constructor(bug, manager) {
    this._stopwatch = new Stopwatch();
    this.project = bug.project;
    this.bug = bug;
    this.manager = manager;
    this.state = PracticeSessionState.Activating;
  }

  setState(state) {
    this.state = state;
  }

  get time() {
    return this._stopwatch.time;
  }

  startStopwatch() {
    this._stopwatch.start();
    this.manager.externals.stopwatch.start();
  }

  showStopwatch() {
    this.manager.externals.stopwatch.show();
  }

  hideStopwatch() {
    this.manager.externals.stopwatch.hide();
  }

  /**
   * @param {number} time 
   */
  setStopwatch(time) {
    this._stopwatch.set(time);
    this.manager.externals.stopwatch.set(time);
  }

  /**
   * @param {number} time 
   */
  stopStopwatch() {
    this._stopwatch.pause();
    this.manager.externals.stopwatch.stop();
    return this._stopwatch.time;
  }
}