import { window, commands } from 'vscode';
import { newLogger, setOutputStreams } from '@dbux/common/src/log/logger';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import ProjectNodeProvider from './projectNodeProvider';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import OutputChannel from './OutputChannel';
import PracticeStopwatch from './PracticeStopwatch';
import { getOrCreateProjectManager } from './projectControl';

// ########################################
//  setup logger for project
// ########################################

const logger = newLogger('projectViewController');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

const outputChannel = new OutputChannel('Dbux');

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

class ProjectViewController {
  constructor(context) {
    this.manager = getOrCreateProjectManager(context);

    // ########################################
    //  init treeView
    // ########################################
    this.treeDataProvider = new ProjectNodeProvider(context, this);
    this.treeView = this.treeDataProvider.treeView;

    this.practiceStopwatch = new PracticeStopwatch('practice');
    this.practiceStopwatch.registOnClick(context, this.maybeStopWatch.bind(this));

    // ########################################
    //  listen on runStatusChanged
    // ########################################
    this.manager.onRunStatusChanged(this.handleStatusChanged.bind(this));
  }

  handleStatusChanged(status) {
    commands.executeCommand('setContext', 'dbuxProjectView.context.isBusy', status === RunStatus.Busy);
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

    return runTaskWithProgressBar(async (progress/* , cancelToken */) => {
      const { bug } = bugNode;
      const runner = this.manager.getOrCreateRunner();

      // cancel any currently running tasks
      progress.report({ message: 'Canceling previous tasks...' });
      await runner.cancel();

      progress.report({ message: 'activating...' });
      // TODO: remove this
      const result = await this.manager._activateBug(bug, debugMode);

      if (result?.code === 0) {
        // test passed
        // TODO: Not using modal after the second time success(check BugProgress)
        window.showInformationMessage('Congratulations!! You have passed all test 🎉🎉🎉', { modal: true });
      }
      else {
        progress.report({ message: 'opening in editor...' });
        await bug.openInEditor();
      }

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