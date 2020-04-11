
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
  // abstract methods
  // ###########################################################################

  /**
   * @abstract
   */
  async install() {
    throw new Error(`${this} did not implement abstract method "install"`);
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

  toString() {
    return this.project.toString();
  }
}