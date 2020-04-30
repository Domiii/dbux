import { newLogger } from 'dbux-common/src/log/logger';
import { ProjectsManager } from 'dbux-projects/src';
import { registerCommand } from './commandUtil';

const logger = newLogger('projectCommands');
const { log, debug, warn, error: logError } = logger;

export function initProjectCommands(extensionContext, projectViewController) {
  registerCommand(extensionContext, 'dbuxProjectView.node.activateBug', async (node) => {
    await projectViewController.activateBugByNode(node);
  });

  registerCommand(extensionContext, 'dbuxProjectView.node.activateBugWithDebugger', async (node) => {
    await projectViewController.activateBugByNode(node, true);
  });
}

/**
 * @param {ProjectsManager} projectViewController 
 */
export function initProjectUserCommands(extensionContext, projectViewController) {
  /**
   * @type {ProjectsManager}
   */
  let { manager } = projectViewController;
  const projects = manager.getOrCreateDefaultProjectList();
  const runner = manager.getOrCreateRunner();

  async function go(debugMode) {
    // cancel any currently running tasks
    await runner.cancel();

    const project1 = projects.getAt(0);

    // activate/install project
    await runner.activateProject(project1);

    // load bugs
    const bugs = await runner.getOrLoadBugs(project1);
    const bug = bugs.getAt(0);

    // open in editor (must be after activation/installation)
    await bug.openInEditor();

    // run it!
    await runner.testBug(bug, debugMode);

    // await runner.deleteProject(project)

    // await runner.forceReinstall(project)

    // TODO: "suggest" some first "analysis steps"?
    // future work: manage/expose (webpack) project background process
  }

  registerCommand(extensionContext, 'dbux.debugProject1Bug0', async () => {
    await go(true);
  });
  registerCommand(extensionContext, 'dbux.runProject1Bug0', async () => {
    await go(false);
  });
  registerCommand(extensionContext, 'dbux.cancelBugRunner', async () => {
    await runner.cancel();
  });
  registerCommand(extensionContext, 'dbux.resetProject1', async () => {
    // await runner.resetProject(project1);
  });
  registerCommand(extensionContext, 'dbux.gotoProject1', async () => {
    // await runner.openInEditor(bug);
  });
}