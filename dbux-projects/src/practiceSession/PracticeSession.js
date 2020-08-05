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
  constructor(project, bug, stopwatchEnabled) {
    this.stopwatch = new Stopwatch();
    this.stopwatchEnabled = stopwatchEnabled;
    this.project = project;
    this.bug = bug;
    this.state = PracticeSessionState.Activating;
  }

  setState(state) {
    this.state = state;
  }
  
  startStopwatch() {
    if (this.stopwatchEnabled) {
      this.stopwatch.start();
    }
    else {
      throw new Error('Stopwatch does not enabled in this practice session');
    }
  }
}