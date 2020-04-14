import sh from 'shelljs';

// ###########################################################################
// fix up shelljs
// ###########################################################################

// hackfix, see: https://github.com/shelljs/shelljs/issues/704#issuecomment-504747414
sh.config.execPath = (
  sh.which('node') || 
  sh.which('nodejs')
).toString();


export default class RunnerImpl {
  /**
   * @type {Project}
   * @readonly
   */
  project;

  constructor(project) {
    this.project = project;
  }

  // ###########################################################################
  // Runner abstract methods
  // ###########################################################################

  /**
   * @abstract
   */
  async installProject() {
    throw new Error(`${this} did not implement abstract method "installProject"`);
  }

  /**
   * @abstract
   */
  async loadBugs() {
    throw new Error(`${this} did not implement abstract method "loadBugs"`);
  }

  /**
   * @abstract
   */
  async selectBug(bug) {
    throw new Error(`${this} did not implement abstract method "selectBug"`);
  }

  /**
   * @abstract
   */
  async testBug(bug, port) {
    throw new Error(`${this} did not implement abstract method "testBug"`);
  }

  // ###########################################################################
  // misc
  // ###########################################################################

  toString() {
    return this.project.toString();
  }
}