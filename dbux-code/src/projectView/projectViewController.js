import { window, commands } from 'vscode';
import path from 'path';
import { newLogger, setOutputStreams } from 'dbux-common/src/log/logger';
import { initDbuxProjects } from 'dbux-projects/src';
import exec from 'dbux-projects/src/util/exec';
import BugRunnerStatus from 'dbux-projects/src/projectLib/BugRunnerStatus';
import ProjectNodeProvider from './projectNodeProvider';
import { showTextDocument } from '../codeUtil/codeNav';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import OutputChannel from './OutputChannel';
import { execInTerminal } from '../terminal/TerminalWrapper';
import PracticeStopwatch from './PracticeStopwatch';
import { set as storageSet, get as storageGet } from '../memento';

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
  },
  storage: {
    get: storageGet,
    set: storageSet,
  },
  execInTerminal
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
    this.practiceStopwatch = new PracticeStopwatch('practice');
    this.practiceStopwatch.registOnClick(context, this.maybeStopWatch.bind(this));

    // ########################################
    //  listen on bugRunner
    // ########################################
    const bugRunner = this.manager.getOrCreateRunner();
    bugRunner.on('statusChanged', this.onStatusChanged.bind(this));
  }

  onStatusChanged(status) {
    commands.executeCommand('setContext', 'dbuxProjectView.context.isBusy', status === BugRunnerStatus.Busy);
    this.treeDataProvider.refreshIcon();
  }

  // ###########################################################################
  // project node buttons
  // ###########################################################################

  nodeAddToWorkspace(projectNode) {
    projectNode.addToWorkspace();
  }

  // ###########################################################################
  // bug node buttons
  // ###########################################################################

  async activateBugByNode(bugNode, debugMode = false) {
    showOutputChannel();
    const options = {
      cancellable: false,
      title: `[dbux] Activating Project ${bugNode.bug.project.name}@${bugNode.bug.name}`
    };

    return runTaskWithProgressBar(async (progress, cancelToken) => {
      const { bug } = bugNode;
      const runner = this.manager.getOrCreateRunner();

      // cancel any currently running tasks
      progress.report({ message: 'Canceling previous tasks...' });
      await runner.cancel();

      // activate it!
      progress.report({ message: 'activating...' });
      await runner.testBug(bug, debugMode);

      progress.report({ message: 'opening in editor...' });
      await bug.openInEditor();

      progress.report({ message: 'Finished!' });

      this.treeDataProvider.refreshIcon();
    }, options);
  }

  // ###########################################################################
  // practice stopwatch
  // ###########################################################################

  async maybeStartWatch() {
    const result = await window.showInformationMessage('Do you want to start the timer?', { modal: true }, 'Yes');
    if (result === 'Yes') {
      this.practiceStopwatch.start();
    }
  }

  async maybeStopWatch() {
    this.practiceStopwatch.pause();
    const result = await window.showInformationMessage('Do you want to stop the timer?', { modal: true }, 'Stop');
    if (result === 'Stop') {
      // already pause, do nothing
      this.practiceStopwatch.hide();
    }
    else {
      this.practiceStopwatch.start();
    }
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