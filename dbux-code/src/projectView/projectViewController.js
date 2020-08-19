import { window, commands } from 'vscode';
import { newLogger, setOutputStreams } from '@dbux/common/src/log/logger';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import { checkSystem } from '@dbux/projects/src/checkSystem';
import ProjectNodeProvider from './projectNodeProvider';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import OutputChannel from './OutputChannel';
import PracticeStopwatch from './PracticeStopwatch';
import { getOrCreateProjectManager } from './projectControl';
import { initRuntimeServer } from '../net/SocketServer';
import { initProjectCommands } from '../commands/projectCommands';

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

export class ProjectViewController {
  constructor(context) {
    this.extensionContext = context;
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
    commands.executeCommand('setContext', 'dbuxProjectView.context.isBusy', RunStatus.is.Busy(status));
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
    await checkSystem(this.manager, false, true);
    showOutputChannel();
    await initRuntimeServer(this.extensionContext);

    const options = {
      cancellable: false,
      title: `[dbux] Activating Project ${bugNode.bug.project.name}@${bugNode.bug.name}`
    };

    return runTaskWithProgressBar(async (progress/* , cancelToken */) => {
      const { bug } = bugNode;
      progress.report({ message: 'activating...' });
      await this.manager.activateBug(bug);
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

/**
 * @type {ProjectViewController}
 */
let controller;

export function initProjectView(context) {
  controller = new ProjectViewController(context);

  // shut it all down when VSCode shuts down
  context.subscriptions.push({
    dispose() {
      controller.manager.stopRunner();
    }
  });

  // refresh right away
  controller.treeDataProvider.refresh();

  // register commands
  initProjectCommands(context, controller);

  return controller;
}