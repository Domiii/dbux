import path from 'path';
import { newLogger } from 'dbux-common/src/log/logger';
import ProjectsManager from 'dbux-projects/src/ProjectsManager';
import { registerCommand } from './commandUtil';

const { log, debug, warn, error: logError } = newLogger('dbux-code');


const cfg = {
  projectsRoot: path.join(__dirname, '../../projects')
};
const externals = {

};

/**
 * @type {ProjectsManager}
 */
let manager;

export function initProjectCommands(extensionContext) {
  manager = new ProjectsManager(cfg, externals);

  const projects = manager.buildDefaultProjectList();
  const runner = manager.newBugRunner();
  
  debug(`Initialized dbux-projects at ${path.resolve(cfg.projectsRoot)}.`);

  registerCommand(extensionContext, 'dbux.runSample0', async () => {
    const project1 = projects.getAt(0);
    const bugs = await project1.getOrLoadBugs();
    const bug = bugs.getAt(0);

    await runner.activateBug(bug);

    // TODO: start webpack if necessary
    // TODO: manage/expose webpack background process
    
    await bug.openInEditor();

    // TODO: runner.executeBugInDebugMode(bug); // use bug.runArgs
    // TODO: runner.
  });
}