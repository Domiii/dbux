import path from 'path';
import { newLogger, setOutputStreams } from 'dbux-common/src/log/logger';
import { initDbuxProjects } from 'dbux-projects/src';
import exec from 'dbux-projects/src/util/exec';
import ProjectNodeProvider from './projectNodeProvider';
import { showTextDocument } from '../codeUtil/codeNav';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import OutputChannel from './OutputChannel';

// ########################################
//  setup logger for project
// ########################################
const logger = newLogger('projectViewController');
const { log, debug, warn, error: logError } = logger;
const outputChannel = new OutputChannel('dbux-project');
setOutputStreams({
  log: outputChannel.log.bind(outputChannel),
  warn: outputChannel.log.bind(outputChannel),
  error: outputChannel.log.bind(outputChannel),
  debug: outputChannel.log.bind(outputChannel)
});

export function showOutputChannel() {
  outputChannel.show();
}

let controller;

const cfg = {
  // TODO: fix these paths (`__dirname` is overwritten by webpack and points to the `dist` dir; `__filename` points to `bundle.js`)
  projectsRoot: path.join(__dirname, '../../projects')
};
const externals = {
  editor: {
    async openFile(fpath) {
      // await exec(`code ${fpath}`, logger, { silent: false }, true);
      return showTextDocument(fpath);
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

    // ########################################
    //  listen on bugRunner
    // ########################################
    const bugRunner = this.manager.getOrCreateRunner();
    bugRunner.on('start', this.treeDataProvider.refresh);
    bugRunner.on('end', this.treeDataProvider.refresh);
  }

  // ###########################################################################
  // project node buttons
  // ###########################################################################

  async nodeAddToWorkspace(projectNode) {
    await projectNode.addToWorkspace();
  }

  // ###########################################################################
  // bug node buttons
  // ###########################################################################

  async activateBugByNode(bugNode, debugMode = false) {
    showOutputChannel();
    const options = {
      title: `[dbux] Activating Project ${bugNode.bug.project.name}@${bugNode.bug.name}`
    };

    runTaskWithProgressBar(async (progress, cancelToken) => {
      const runner = this.manager.getOrCreateRunner();
      cancelToken.onCancellationRequested(runner.cancel.bind(runner));

      await this._activateBug(progress, cancelToken, bugNode.bug, debugMode);
    }, options);
  }

  async _activateBug(progress, cancelToken, bug, debugMode = false) {
    if (cancelToken.isCancellationRequested) {
      return;
    }
    const runner = this.manager.getOrCreateRunner();
    // cancel any currently running tasks
    await runner.cancel();

    // activate/install project
    if (cancelToken.isCancellationRequested) {
      return;
    }
    progress.report({ increment: 5, message: 'installing project...' });
    await runner.activateProject(bug.project);

    // open in editor (must be after activation/installation)
    if (cancelToken.isCancellationRequested) {
      return;
    }
    progress.report({ increment: 45, message: 'opening in editor...' });
    await bug.openInEditor();

    // run it!
    if (cancelToken.isCancellationRequested) {
      return;
    }
    progress.report({ increment: 15, message: 'running bug test...' });
    await runner.testBug(bug, debugMode);


    progress.report({ increment: 35, message: 'Finished!' });
  }
}

// ###########################################################################
// init
// ###########################################################################

export function initProjectView(context) {
  controller = new ProjectViewController(context);

  // shut it all down when VSCode shuts down
  context.subscriptions.push({
    dispose() {
      const runner = controller.manager.getOrCreateRunner();
      runner.cancel();
    }
  });

  // refresh right away
  controller.treeDataProvider.refresh();

  return controller;
}