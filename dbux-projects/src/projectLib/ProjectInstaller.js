import sh from 'shelljs';

// ###########################################################################
// fix up shelljs
// ###########################################################################

// hackfix, see: https://github.com/shelljs/shelljs/issues/704#issuecomment-504747414
sh.config.execPath = (
  sh.which('node') || 
  sh.which('nodejs')
).toString();

export default class ProjectInstaller {
  /**
   * @type {Project}
   * @readonly
   */
  project;

  constructor(project) {
    this.project = project;
  }

  // ###########################################################################
  // Installer implementation
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

  // ###########################################################################
  // misc
  // ###########################################################################

  toString() {
    return this.project.toString();
  }
}