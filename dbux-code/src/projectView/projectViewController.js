import { window, ProgressLocation } from 'vscode';
import path from 'path';
import { newLogger } from 'dbux-common/src/log/logger';
import { initDbuxProjects } from 'dbux-projects/src';
import exec from 'dbux-projects/src/util/exec';
import ProjectNodeProvider from './projectNodeProvider';

const logger = newLogger('projectViewController');
const { log, debug, warn, error: logError } = logger;

let controller;

const cfg = {
  projectsRoot: path.join(__dirname, '../../projects')
};
const externals = {
  editor: {
    async openFile(fpath) {
      // TODO: use vscode API to open in `this` editor window
      await exec(`code ${fpath}`, logger, { silent: false }, true);
    },
    async openFolder(fpath) {
      // TODO: use vscode API to add to workspace
      await exec(`code --add ${fpath}`, logger, { silent: false }, true);
    }
  }
};

class ProjectViewController {
  constructor(context) {
    // ########################################
    //  init projectManager
    // ########################################
    this.manager = initDbuxProjects(cfg, externals);
    debug(`Initialized dbux-projects. Projects folder = "${path.resolve(cfg.projectsRoot)}"`);

    // ########################################
    //  init treeView
    // ########################################
    this.treeDataProvider = new ProjectNodeProvider(context, this);
    this.treeView = this.treeDataProvider.treeView;
  }

  async goWithProgress(bugNode, debugMode = true) {
    window.withProgress({
      cancellable: true,
      location: ProgressLocation.Notification,
      title: `Activating bug{${bugNode.bug.name}} of project{${bugNode.bug.project.name}}`
    }, async (progress, cancelToken) => {
      const runner = this.manager.getOrCreateRunner();
      cancelToken.onCancellationRequested(() => {
        log('canceled');
        runner.cancel();
      });
      await this._go(progress, cancelToken, runner, bugNode, debugMode);
    });
  }

  async _go(progress, cancelToken, runner, bugNode, debugMode = true) {
    // cancel any currently running tasks
    await runner.cancel();

    // activate/install project
    if (cancelToken.isCancellationRequested) {
      return;
    }
    progress.report({ increment: 40, message: 'activating...' });
    await runner.activateProject(bugNode.bug.project);

    // load bugs
    const { bug } = bugNode;

    // open in editor (must be after activation/installation)
    if (cancelToken.isCancellationRequested) {
      return;
    }
    progress.report({ increment: 20, message: 'opening in editor...' });
    await bug.openInEditor();

    // run it!
    if (cancelToken.isCancellationRequested) {
      return;
    }
    progress.report({ increment: 40, message: 'running test...' });
    await runner.testBug(bug, debugMode);
  }
}

// ###########################################################################
// init
// ###########################################################################

export function initProjectView(context) {
  controller = new ProjectViewController(context);

  // refresh right away
  controller.treeDataProvider.refresh();

  return controller;
}