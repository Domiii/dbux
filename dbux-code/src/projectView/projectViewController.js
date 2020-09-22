import { window, commands } from 'vscode';
import { newLogger, setOutputStreams } from '@dbux/common/src/log/logger';
import BugRunnerStatus from '@dbux/projects/src/projectLib/BugRunnerStatus';
import { checkSystem } from '@dbux/projects/src/checkSystem';
import ProjectNodeProvider from './projectNodeProvider';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import OutputChannel from './OutputChannel';
import PracticeStopwatch from './PracticeStopwatch';
import { getOrCreateProjectManager } from './projectControl';
import { initRuntimeServer } from '../net/SocketServer';
import { initProjectCommands } from '../commands/projectCommands';
import { get as mementoGet, set as mementoSet } from '../memento';

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

    this.isShowingTreeView = mementoGet(showProjectViewKeyName, true);
    commands.executeCommand('setContext', 'dbux.context.showProjectView', this.isShowingTreeView);

    // ########################################
    //  init treeView
    // ########################################
    this.treeDataProvider = new ProjectNodeProvider(context, this);

    this.practiceStopwatch = new PracticeStopwatch('practice');
    this.practiceStopwatch.registOnClick(context, this.maybeStopWatch.bind(this));

    // ########################################
    //  listen on bugRunner
    // ########################################
    const bugRunner = this.manager.getOrCreateRunner();
    bugRunner.on('statusChanged', this.onStatusChanged.bind(this));
  }

  get treeView() {
    return this.treeDataProvider.treeView;
  }

  onStatusChanged(status) {
    commands.executeCommand('setContext', 'dbuxProjectView.context.isBusy', status === BugRunnerStatus.Busy);
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
      title: `[dbux] Bug ${bugNode.bug.project.name}@${bugNode.bug.name}`
    };

    return runTaskWithProgressBar(async (progress/* , cancelToken */) => {
      const { bug } = bugNode;
      const runner = this.manager.getOrCreateRunner();

      // cancel any currently running tasks
      progress.report({ message: 'canceling previous tasks...' });
      await runner.cancel();

      // run it!
      const { project } = bug;
      progress.report({ message: `downloading "${project.name}"...` });
      await runner.activateProject(project);


      progress.report({ message: 'running test...' });
      // NOTE: --enable-source-maps gets super slow in production mode for some reason
      // NOTE2: nolazy is required for proper breakpoints in debug mode
      // const enableSourceMaps = '--enable-source-maps';
      const enableSourceMaps = '';
      const nodeArgs = `--stack-trace-limit=100 ${debugMode ? '--nolazy' : ''} ${enableSourceMaps}`;
      const cfg = {
        debugMode,
        nodeArgs,
        dbuxArgs: '--verbose=1'
      };
      const result = await runner.testBug(bug, cfg);

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
        const runner = controller.manager.getOrCreateRunner();
        runner.cancel();
      }
    });

    // refresh right away
    controller.treeDataProvider.refresh();

    // register commands
    initProjectCommands(context, controller);
  }

  return controller;
}