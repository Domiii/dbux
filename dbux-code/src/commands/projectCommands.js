import { newLogger } from 'dbux-common/src/log/logger';
import { ProjectsManager } from 'dbux-projects/src';
import { registerCommand } from './commandUtil';

const logger = newLogger('projectCommands');
const { log, debug, warn, error: logError } = logger;

export function initProjectCommands(extensionContext, projectViewController) {

}

/**
 * @param {ProjectsManager} projectViewController 
 */
export function initProjectUserCommands(extensionContext, projectViewController) {
  /**
   * @type {ProjectsManager}
   */
  let { manager } = projectViewController;
  const { projects, runner } = manager;

  async function go(debugMode) {
    // cancel any currently running tasks
    await runner.cancel();

    const project1 = projects.getAt(0);

    // activate/install project
    await runner.activateProject(project1);

    // load bugs
    const bugs = await runner.getOrLoadBugs(project1);
    const bug = bugs.getAt(0);

    // checkout bug -> activate bug
    await runner.activateBug(bug);

    // open in editor (must be after activation/installation)
    await bug.openInEditor();

    // run it!
    await runner.testBug(bug, debugMode);

    // TODO: "suggest" some first "analysis steps"?
    // future work: manage/expose (webpack) project background process
  }

  registerCommand(extensionContext, 'dbux.debugProjectBug0', async () => {
    await go(true);
  });
  registerCommand(extensionContext, 'dbux.runProjectBug0', async () => {
    await go(false);
  });
  registerCommand(extensionContext, 'dbux.cancelBugRunner', async () => {
    await runner.cancel();
  });
}