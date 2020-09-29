import { commands } from 'vscode';
import sleep from '@dbux/common/src/util/sleep';
import { newLogger, setOutputStreams } from '@dbux/common/src/log/logger';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import { checkSystem } from '@dbux/projects/src/checkSystem';
import ProjectNodeProvider from './practiceView/ProjectNodeProvider';
import SessionNodeProvider from './sessionView/SessionNodeProvider';
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

const logger = newLogger('dbux-practice');

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
    this.maybeNotifyExistingPracticeSession();

    // ########################################
    //  init treeView
    // ########################################
    this.projectViewNodeProvider = new ProjectNodeProvider(context, this);
    this.sessionViewNodeProvider = new SessionNodeProvider(context, this);

    this.isShowingTreeView = mementoGet(showProjectViewKeyName, true);
    commands.executeCommand('setContext', 'dbux.context.showPracticeViews', this.isShowingTreeView);

    this.practiceStopwatch = getStopwatch();
    this.practiceStopwatch.onClick(context, this.maybeStopPractice.bind(this));

    // ########################################
    //  listen on runStatusChanged
    // ########################################
    this.manager.onRunStatusChanged(this.handleStatusChanged.bind(this));
    this.manager.onBugStatusChanged(this.refresh.bind(this));
    this.manager.onPracticeSessionChanged(this.handlePracticeSessionChanged.bind(this));
    this.handlePracticeSessionChanged();
  }

  async maybeNotifyExistingPracticeSession() {
    try {
      if (this.manager.practiceSession) {
        const { bug } = this.manager.practiceSession;
        await showInformationMessage(`[Dbux] You are currently practicing ${bug.id}`, {
          'OK'() { },
          'Give up': this.maybeStopPractice.bind(this)
        });
      }
    }
    catch (err) {
      logError(err);
    }
  }

  get treeView() {
    return this.projectViewNodeProvider.treeView;
  }

  isShowingPraciceView() {
    return !this.manager.practiceSession;
  }

  async handleStatusChanged(status) {
    try {
      await commands.executeCommand('setContext', 'dbuxProjectView.context.isBusy', RunStatus.is.Busy(status));
      this.isShowingPraciceView() && this.projectViewNodeProvider.refreshIcon();
    }
    catch (err) {
      logError(err);
    }
  }

  refresh() {
    if (this.isShowingTreeView) {
      if (this.isShowingPraciceView()) {
        this.projectViewNodeProvider.refreshIcon();
      }
      else {
        this.sessionViewNodeProvider.refresh();
      }
    }
  }

  // ###########################################################################
  // toggleTreeView
  // ###########################################################################

  async toggleTreeView() {
    if (this.isShowingTreeView) {
      if (!await this.confirmCancelPracticeSession()) {
        return;
      }
    }

    this.isShowingTreeView = !this.isShowingTreeView;
    // hackfix: hiding treeview before it is completely rendered will cause vscode error without logging anything
    // then the view will be broken in some way e.g. always empty, no node is passed as parameter when trigger tree item button
    // so we need to wait for it, but currently vscode does not provide any promise to handle this, we can only wait for a contant time
    await sleep(500);
    await commands.executeCommand('setContext', 'dbux.context.showPracticeViews', this.isShowingTreeView);
    await mementoSet(showProjectViewKeyName, this.isShowingTreeView);
    this.refresh();
  }

  async handlePracticeSessionChanged() {
    try {
      await commands.executeCommand('setContext', 'dbux.context.hasPracticeSession', !!this.manager.practiceSession);
      this.refresh();
    }
    catch (err) {
      logError(err);
    }
  }

  // ###########################################################################
  // project node buttons
  // ###########################################################################

  nodeAddToWorkspace(projectNode) {
    projectNode.addToWorkspace();
  }

  // ###########################################################################
  // practice session
  // ###########################################################################

  async startPractice(bugNode) {
    if (this.manager.practiceSession) {
      if (!await this.confirmCancelPracticeSession()) {
        return;
      }
    }
    
    showOutputChannel();

    const options = {
      cancellable: false,
      title: `[dbux] Bug ${bugNode.bug.id}`
    };

    try {
      await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
        const { bug } = bugNode;
  
        progress.report({ message: 'checking system requirements...' });
        await this.checkActivateBugRequirement();
  
        progress.report({ message: 'activating...' });
        await this.manager.startPractice(bug);
      }, options);
    }
    catch (err) {
      logError(err);
    }
  }

  async activate(debugMode) {
    showOutputChannel();

    const { bug } = this.manager.practiceSession;

    const options = {
      cancellable: false,
      title: `[dbux] Bug ${bug.id}`
    };

    await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
      progress.report({ message: 'checking system requirements...' });
      await this.checkActivateBugRequirement();

      progress.report({ message: 'activating...' });
      await this.manager.activate(debugMode);
    }, options);
  }

  async checkActivateBugRequirement() {
    await checkSystem(this.manager, false, true);
    await initRuntimeServer(this.extensionContext);
  }

  async confirmCancelPracticeSession() {
    if (this.manager.practiceSession) {
      const result = await showInformationMessage('You must give up current practice session before continue', {
        'Give up': async () => {
          await this.manager.stopPractice();
          return true;
        }
      }, { modal: true });

      return result || false;
    }
    else {
      return true;
    }
  }

  async maybeStopPractice() {
    const { practiceSession } = this.manager;
    const confirmString = (practiceSession.stopwatchEnabled && !practiceSession.isSolved) ?
      'Are you sure you want to give up the timed challenge?' :
      'Do you want to stop the practice session?';
    await showInformationMessage(confirmString, {
      Yes: async () => {
        await this.manager.stopPractice();
      }
    }, { modal: true });
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
    controller.projectViewNodeProvider.refresh();
    controller.sessionViewNodeProvider.refresh();

    // register commands
    initProjectCommands(context, controller);
  }

  return controller;
}