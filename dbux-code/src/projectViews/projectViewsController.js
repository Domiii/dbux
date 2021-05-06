import { commands, window, Uri, workspace } from 'vscode';
import { newLogger, setOutputStreams } from '@dbux/common/src/log/logger';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import allApplications from '@dbux/data/src/applications/allApplications';
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
import { initCodeEvents } from '../practice/codeEvents';
import { translate } from '../lang';
import { getLogsDirectory } from '../resources';
import { openProjectWorkspace, isInCorrectWorkspace } from '../codeUtil/workspaceUtil';

/** @typedef {import('./practiceView/BugNode').default} BugNode */

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

    // ########################################
    //  init treeView
    // ########################################
    this.isShowingTreeView = mementoGet(showProjectViewKeyName, true);
    commands.executeCommand('setContext', 'dbux.context.showPracticeViews', this.isShowingTreeView);
    commands.executeCommand('setContext', 'dbux.context.hasPracticeSession', !!this.manager.practiceSession);

    this.projectViewNodeProvider = new ProjectNodeProvider(context, this);
    this.sessionViewNodeProvider = new SessionNodeProvider(context, this);

    this.practiceStopwatch = getStopwatch();
    this.practiceStopwatch.onClick(context, async () => {
      await this.manager.stopPractice();
    });

    // ########################################
    //  listen on practice status changed
    // ########################################
    this.manager.onRunStatusChanged(this.handleStatusChanged.bind(this));
    this.manager.onBugStatusChanged(this.refresh.bind(this));
    this.manager.onPracticeSessionStateChanged(this.handlePracticeSessionStateChanged.bind(this));

    initCodeEvents(this.manager, context);

    this.maybeNotifyExistingPracticeSession();
  }

  async maybeNotifyExistingPracticeSession() {
    try {
      if (this.manager.practiceSession) {
        const { bug } = this.manager.practiceSession;
        await showInformationMessage(translate('projectView.existBug.message', { bug: bug.id }), {
          [translate('projectView.existBug.ok')]() { },
          [translate('projectView.existBug.giveUp')]: async () => {
            await this.manager.stopPractice();
          }
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
      if (!await this.confirmCancelPracticeSession(true)) {
        return;
      }
    }

    this.isShowingTreeView = !this.isShowingTreeView;
    if (this.isShowingTreeView) {
      await commands.executeCommand('setContext', 'dbux.context.hasPracticeSession', !!this.manager.practiceSession);
    }
    await commands.executeCommand('setContext', 'dbux.context.showPracticeViews', this.isShowingTreeView);
    await mementoSet(showProjectViewKeyName, this.isShowingTreeView);
    this.refresh();
  }

  async handlePracticeSessionStateChanged(dontRefreshView) {
    if (!dontRefreshView) {
      try {
        await commands.executeCommand('setContext', 'dbux.context.hasPracticeSession', !!this.manager.practiceSession);
        this.refresh();
      }
      catch (err) {
        logError(err);
      }
    }
  }

  // ###########################################################################
  // practice session
  // ###########################################################################

  /**
   * @param {BugNode} bugNode 
   */
  async startPractice(bugNode) {
    if (this.manager.practiceSession) {
      if (!await this.confirmCancelPracticeSession()) {
        return;
      }
    }

    const { bug, projectNode: { project } } = bugNode;
    const title = `Bug ${`"${bug.label}"` || ''} (${bug.id})`;
    await this.runProjectTask(title, async (report) => {
      // TOTRANSLATE
      report({ message: 'Activating...' });
      await this.manager.startPractice(bug);

      if (!isInCorrectWorkspace(project)) {
        await openProjectWorkspace(project);
      }
    });
  }

  async loadPracticeSession() {
    const openFileDialogOptions = {
      // TOTRANSLATE
      title: 'Select a log file to read',
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Dbux Log File': ['dbuxlog']
      },
      defaultUri: Uri.file(getLogsDirectory())
    };
    const file = (await window.showOpenDialog(openFileDialogOptions))?.[0];
    if (file) {
      // TOTRANSLATE
      const title = 'Load practice log';
      const loaded = await this.runProjectTask(title, async (report) => {
        // TOTRANSLATE
        report({ message: 'Loading file....' });
        return await this.manager.loadPracticeSessionFromFile(file.fsPath);
      });
      if (loaded) {
        await showInformationMessage(`Log file ${file.fsPath} loaded`);
      }
    }
  }

  async activate(inputCfg) {
    const { bug } = this.manager.practiceSession;
    const title = `Bug ${`"${bug.label}"` || ''} (${bug.id})`;
    await this.runProjectTask(title, async (report) => {
      // TOTRANSLATE
      report({ message: 'Running test...' });
      await this.manager.practiceSession.activate(inputCfg);
    });
  }

  /**
   * 
   * @param {string} title 
   * @param {taskCallback} task 
   * @param {boolean} cancellable 
   */
  async runProjectTask(title, task, cancellable = false) {
    showOutputChannel();
    return await runTaskWithProgressBar(async (progress) => {
      // TOTRANSLATE
      progress.report({ message: 'Initializing runtime server...' });
      await initRuntimeServer(this.extensionContext);

      return await task(progress.report.bind(progress));
    }, { title, cancellable });
  }

  async confirmCancelPracticeSession(dontRefreshView = false) {
    return await this.manager.stopPractice(dontRefreshView);
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