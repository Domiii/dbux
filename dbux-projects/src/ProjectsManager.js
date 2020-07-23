import caseStudyRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';
import ProgressLogController from './dataLib/ProgressLogController';
import Stopwatch from './stopwatch/Stopwatch';

/**
 * @typedef {import('./externals/Storage').default} ExternalStorage
 */

export default class ProjectsManager {
  projects;
  runner;

  /**
   * @param {Object} externals 
   * @param {ExternalStorage} externals.storage
   */
  constructor(cfg, externals) {
    this.config = cfg;
    this.externals = externals;
    this.editor = externals.editor;
    this.stopwatch = new Stopwatch();

    this.progressLogController = new ProgressLogController(externals.storage);
  }

  /**
   * Retrieves all case study objects, 
   * sorted by name (in descending order).
   */
  getOrCreateDefaultProjectList() {
    if (!this.projects) {
      // fix up names
      for (const name in caseStudyRegistry) {
        const Clazz = caseStudyRegistry[name];

        // NOTE: function/class names might get mangled by Webpack (or other bundlers/tools)
        Clazz.constructorName = name;
      }

      // sort all classes by name
      const classes = Object.values(caseStudyRegistry);
      classes.sort((a, b) => {
        const nameA = a.constructorName.toLowerCase();
        const nameB = b.constructorName.toLowerCase();
        return nameB.localeCompare(nameA);
      });

      // build + return ProjectList
      const list = new ProjectList(this);
      list.add(...classes.map(ProjectClazz =>
        new ProjectClazz(this)
      ));

      this.projects = list;
    }

    return this.projects;
  }

  getOrCreateRunner() {
    if (!this.runner) {
      const runner = this.runner = new BugRunner(this);
      runner.start();
    }
    return this.runner;
  }

  async saveRunningBug(bug) {
    let patchString = await bug.project.getPatchString();
    if (patchString) {
      // TODO: prompt? or something else
      this.progressLogController.util.processUnfinishTestRun(bug, patchString);
    }
  }

  async resetBug(bug) {
    await bug.project.gitResetHard(true, 'This will discard all your changes on this bug.');
    await this.progressLogController.util.processUnfinishTestRun(bug, '');
  }

  async applyNewBugPatch(bug) {
    let testRuns = this.progressLogController.util.getTestRunsByBug(bug);
    let testRun = testRuns.reduce((a, b) => {
      if (!a) {
        return b;
      }
      return a.createAt > b.createAt ? a : b;
    }, undefined);
    let patchString = testRun?.patch;

    if (patchString) {
      await bug.project.applyPatchString(patchString);
    }
  }

  async installDependencies() {
    const { projectsRoot } = this.config;

    if (process.env.NODE_ENV === 'production') {
      // TODO: install dbux dependencies + their dependencies

      // _dbux_run.js requires socket.io-client -> install in projects/ root
      //    NOTE: this will be taken care of by installing above dependencies automatically (because runtime also depends on `socket.io-client`)
      await this.runner._exec(this, `yarn add socket.io-client@2.3.0`, {
        processOptions: {
          cwd: projectsRoot
        }
      });
    }
  }

  async askForSubmit() {
    const confirmString = 'You have passed the test for the first time, would you like to submit the result?';
    const shouldSubmit = await this.externals.confirm(confirmString);
    
    if (shouldSubmit) {
      this.submit();
    }
  }

  /**
   * Record the practice session data after user passed all tests.
   */
  submit() {
    // TODO
  }
}