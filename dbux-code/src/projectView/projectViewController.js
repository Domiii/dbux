import { commands } from 'vscode';
import { newLogger, setOutputStreams } from '@dbux/common/src/log/logger';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import { checkSystem } from '@dbux/projects/src/checkSystem';
import ProjectNodeProvider from './projectNodeProvider';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import OutputChannel from './OutputChannel';
import { getStopwatch } from './practiceStopwatch';
import { getOrCreateProjectManager } from './projectControl';
import { initRuntimeServer } from '../net/SocketServer';
import { initProjectCommands } from '../commands/projectCommands';
import { get as mementoGet, set as mementoSet } from '../memento';
import { showInformationMessage } from '../codeUtil/codeModals';

const showProjectViewKeyName = 'dbux.projectView.showing';

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
}, true);

export function showOutputChannel() {
  outputChannel.show();
}

export class ProjectViewController {
  constructor(context) {
    this.extensionContext = context;
    this.manager = getOrCreateProjectManager(context);

    this.isShowingTreeView = mementoGet(showProjectViewKeyName, false);
    commands.executeCommand('setContext', 'dbux.context.showProjectView', this.isShowingTreeView);

    // ########################################
    //  init treeView
    // ########################################
    this.treeDataProvider = new ProjectNodeProvider(context, this);

    this.practiceStopwatch = getStopwatch();
    this.practiceStopwatch.onClick(context, this.maybeStopWatch.bind(this));

    // ########################################
    //  listen on runStatusChanged
    // ########################################
    this.manager.onRunStatusChanged(this.handleStatusChanged.bind(this));
  }

  get treeView() {
    return this.treeDataProvider.treeView;
  }

  handleStatusChanged(status) {
    commands.executeCommand('setContext', 'dbuxProjectView.context.isBusy', RunStatus.is.Busy(status));
    this.treeDataProvider.refreshIcon();
  }

  // ###########################################################################
  // toggleTreeView
  // ###########################################################################

  async toggleTreeView() {
    this.isShowingTreeView = !this.isShowingTreeView;
    await commands.executeCommand('setContext', 'dbux.context.showProjectView', this.isShowingTreeView);
    await mementoSet(showProjectViewKeyName, this.isShowingTreeView);
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
    await checkSystem(this.manager, false, true);
    await initRuntimeServer(this.extensionContext);

    const options = {
      cancellable: false,
      title: `[dbux] Testing bug ${bugNode.bug.project.name}@${bugNode.bug.name}`
    };

    return runTaskWithProgressBar(async (progress/* , cancelToken */) => {
      const { bug } = bugNode;
      progress.report({ message: 'activating...' });
      await this.manager.activateBug(bug, debugMode);
    }, options);
  }

  // ###########################################################################
  // practice stopwatch
  // ###########################################################################

  async maybeStopWatch() {
    await showInformationMessage('Stop practice?', {
      Stop: async () => {
        await this.manager.stopPracticeSession();
      }
    });
  }
}

// ###########################################################################
// init/dispose
// ###########################################################################

/**
 * @type {ProjectViewController}
 */
let controller;

export function initProjectView(context) {
  if (!controller) {
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
  }

  return controller;
}