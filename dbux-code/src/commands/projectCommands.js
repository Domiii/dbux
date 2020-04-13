import path from 'path';
import ProjectsManager from 'dbux-projects/src/ProjectsManager';
import { registerCommand } from './commandUtil';


const cfg = {
  projectsRoot: path.join(__dirname, '../../../projects')
};
const externals = {

};

let manager;

export function initProjectCommands(extensionContext) {
  manager = new ProjectsManager(cfg, externals);

  const projects = manager.buildDefaultProjectList();
  const runner = manager.newBugRunner();

  registerCommand(extensionContext, 'dbux.runSample0', async () => {
    const project1 = projects.getAt(0);
    const bugs = await project1.getOrLoadBugs();
    const bug = bugs.getAt(0);

    await runner.activateBug(bug);
    // await bug.openEditor();
  });
}