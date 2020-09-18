import Stopwatch from './Stopwatch';
import PracticeSessionState from './PracticeSessionState';

/** @typedef {import('../projectLib/Project').default} Project */
/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('../ProjectsManager').default} ProjectsManager */

export default class PracticeSession {
  /**
   * A PracticeSession contains the information that user solving a bug.
   * @param {Bug} bug 
   * @param {ProjectsManager} manager
   */
  constructor(bug, manager, state = PracticeSessionState.Activating) {
    this.stopwatch = new Stopwatch(manager.externals.stopwatch);
    this.project = bug.project;
    this.bug = bug;
    this.manager = manager;
    this.state = state;
  }

  setState(state) {
    this.state = state;
  }
}