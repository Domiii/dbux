import sh from 'shelljs';
import EmptyObject from 'dbux-common/src/util/EmptyObject';

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
  // utilities
  // ###########################################################################

  async exec(command, options, ignoreNotFound = false) {
    options = {
      ...(options || EmptyObject),
      async: true
    };

    // promisify `shelljs.exec` with async: true
    const cloneResult = await new Promise((resolve) => {
      sh.exec(command, options, resolve);
    });
    if (!ignoreNotFound && cloneResult.code === 127) {
      // command not found
      // see: https://stackoverflow.com/questions/1763156/127-return-code-from
      throw new Error(`"${command}" failed because executable or command not found. Either configure it's absolute path or make sure that it is installed and in your PATH.`);
    }
  }

  // ###########################################################################
  // misc
  // ###########################################################################

  toString() {
    return this.project.toString();
  }
}