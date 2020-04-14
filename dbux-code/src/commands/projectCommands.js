import path from 'path';
import { newLogger } from 'dbux-common/src/log/logger';
import ProjectsManager from 'dbux-projects/src/ProjectsManager';
import exec from 'dbux-projects/src/util/exec';
import { registerCommand } from './commandUtil';

const { log, debug, warn, error: logError } = newLogger('dbux-code');


const cfg = {
  projectsRoot: path.join(__dirname, '../../projects')
};
const externals = {
  editor: {
    async openFile(fpath) {
      // TODO: use vscode API to open in `this` editor window
      await exec(`code ${fpath}`, { silent: false }, true);
    },
    async openFolder(fpath) {
      // TODO: use vscode API to add to workspace
      await exec(`code --add ${fpath}`, { silent: false }, true);
    }
  }
};

/**
 * @type {ProjectsManager}
 */
let manager;

export function initProjectCommands(extensionContext) {
  manager = new ProjectsManager(cfg, externals);

  const projects = manager.buildDefaultProjectList();
  const runner = manager.newBugRunner();
  
  debug(`Initialized dbux-projects. Projects folder = "${path.resolve(cfg.projectsRoot)}"`);

  registerCommand(extensionContext, 'dbux.runSample0', async () => {
    const project1 = projects.getAt(0);
    const bugs = await project1.getOrLoadBugs();
    const bug = bugs.getAt(0);

    // install project -> start webpack -> checkout bug -> activate bug for us
    await runner.activateBug(bug);

    // TODO: manage/expose (webpack) project background process
    
    await bug.openInEditor();

    await runner.testBug(bug);

    // TODO: "suggest" some first "analysis steps"
  });
}