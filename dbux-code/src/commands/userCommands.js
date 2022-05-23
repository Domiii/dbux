/* eslint-disable camelcase */
import { window } from 'vscode';
import path from 'path';

import open from 'open';
import { existsSync } from 'fs';
import isNaN from 'lodash/isNaN';
import NestedError from '@dbux/common/src/NestedError';
import sleep from '@dbux/common/src/util/sleep';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import { stringify as jsonStringify } from 'comment-json';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { newLogger } from '@dbux/common/src/log/logger';
import { checkSystem, getDefaultRequirement } from '@dbux/projects/src/checkSystem';
import { importApplicationFromFile, exportApplicationToFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import { pathNormalizedForce } from '@dbux/common-node/src/util/pathUtil';
// import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { registerCommand } from './commandUtil';
import { getSelectedApplicationInActiveEditorWithUserFeedback } from '../applicationsView/applicationModals';
import { showGraphView, hideGraphView } from '../webViews/graphWebView';
import { showPathwaysView, hidePathwaysView } from '../webViews/pathwaysWebView';
import { showDDGView } from '../webViews/ddgWebView';
import { setShowDeco } from '../codeDeco';
import { toggleNavButton } from '../toolbar';
import { toggleErrorLog } from '../logging';
import { getProjectManager } from '../projectViews/projectControl';
import { showHelp } from '../help';
// import { installDbuxDependencies } from '../codeUtil/installUtil';
import { showOutputChannel } from '../projectViews/projectViewsController';
import { chooseFile, confirm, showErrorMessage, showInformationMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import { getDefaultExportDirectory, getLogsDirectory } from '../codeUtil/codePath';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import searchController from '../search/searchController';
import { emitSelectTraceAction, emitShowOutputChannelAction } from '../userEvents';
import { runFile } from './runCommands';
import { get as mementoGet, set as mementoSet } from '../memento';
import { getOrOpenTraceEditor } from '../codeUtil/codeNav';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('userCommands');

const TestDDGKeyName = 'dbux.command.testDDG.params';

async function doImportApplication(filePath) {
  allApplications.selection.clear();

  await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
    progress.report({ message: `importing from "${path.basename(filePath)}"...` });
    await sleep(20);
    await importApplicationFromFile(filePath);
    await sleep(20);
  });
}


export function initUserCommands(extensionContext) {
  // ###########################################################################
  // exportApplicationData
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.exportApplicationData', async () => {
    const application = await getSelectedApplicationInActiveEditorWithUserFeedback();

    let exportFpath = application.getDefaultApplicationExportPath();
    if (await confirm('Zip?', true, true)) {
      exportFpath += '.zip';
    }
    if (existsSync(exportFpath)) {
      if (!await confirm(`File already exists: "${exportFpath}" - Overwrite?`, true, true)) {
        return;
      }
    }

    await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
      progress.report({ message: 'exporting...' });
      await sleep();    // TODO: fix this in general -> reported message does not show up before next tick
      application && await exportApplicationToFile(application, exportFpath);
    });

    const msg = translate('savedSuccessfully', { fileName: exportFpath });
    await showInformationMessage(msg, {
      async 'Show File'() {
        await open(path.dirname(exportFpath));
      }
    });
  });

  registerCommand(extensionContext, 'dbux.importApplicationData', async () => {
    let defaultImportDir = getDefaultExportDirectory();

    const fileDialogOptions = {
      title: 'Select a file to read',
      folder: defaultImportDir,
      filters: {
        'json or zip': ['json', 'zip']
      },
    };
    const filePath = await chooseFile(fileDialogOptions);
    if (filePath) {
      await doImportApplication(filePath);
    }
  });

  // ###########################################################################
  // show/hide graph view
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showGraphView', async () => {
    await showGraphView(extensionContext);
  });

  registerCommand(extensionContext, 'dbux.hideGraphView', async () => {
    hideGraphView();
  });

  // ###########################################################################
  // show/hide pathways view
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showPathwaysView', async () => {
    await showPathwaysView();
  });

  registerCommand(extensionContext, 'dbux.hidePathwaysView', async () => {
    hidePathwaysView();
  });

  // ###########################################################################
  // testing DDG code
  // ###########################################################################

  /**
   * testing + dev-only
   * NOTE: this is code for testing → move to test file
   */
  registerCommand(extensionContext, 'dbux.testDataDependencyGraph', async () => {
    let { testFilePath, contextId } = mementoGet(TestDDGKeyName, EmptyObject);

    if (!allApplications.selection.count) {
      const defaultImportDir = pathNormalizedForce(getDefaultExportDirectory());
      // const testFileName = 'data-multi1';
      // const testFilePath = pathResolve(defaultImportDir, testFile + '_data.json.zip');
      // await doImportApplication(testFilePath);

      // load an application, if none active
      const confirmMsg = `Current test file: "${testFilePath?.replace(defaultImportDir, '')}"\nDo you want to proceed?`;
      const shouldUpdateTestFilePath = !testFilePath || !await confirm(confirmMsg);
      if (shouldUpdateTestFilePath) {
        const fileDialogOptions = {
          title: 'Select a new test file to read',
          folder: getDefaultExportDirectory(),
          filters: {
            'Dbux Exported Application Data': ['json.zip']
          },
        };
        testFilePath = await chooseFile(fileDialogOptions);
        if (!testFilePath) {
          throw new Error(`DDG Test Cancelled - No test file selected`);
        }
        testFilePath = pathNormalizedForce(testFilePath);

        // unset contextId
        contextId = 0;

        await mementoSet(TestDDGKeyName, { testFilePath, contextId });
      }

      await doImportApplication(testFilePath);
    }

    let trace = traceSelection.selected;
    if (!trace) {
      // default: get first active application
      const firstApplication = allApplications.selection.getFirst();
      if (!firstApplication) {
        throw new Error('Could not run DDG test: No applications running');
      }

      // default: select first function context
      // if (await this.componentManager.externals.confirm('No trace selected. Automatically select first function context in first application?')) {
      const dp = firstApplication.dataProvider;
      const needsNewContextId = !contextId;
      if (needsNewContextId) {
        const firstFunctionContext = dp.collections.executionContexts.getAllActual().
          find(context => dp.util.isContextFunctionContext(context.contextId));
        if (!firstFunctionContext) {
          throw new Error('Could not run DDG test: Could not find a function context in application');
        }
        contextId = firstFunctionContext.contextId;
        const userInput = await window.showInputBox({
          placeHolder: 'contextId',
          value: contextId,
          prompt: 'Enter the contextId to test DDG'
        });
        contextId = parseInt(userInput, 10);
        if (!contextId) {
          throw new Error(`Invalid contextId (expected but is not positive integer): ${userInput}`);
        }
      }

      // select trace by contextId
      trace = dp.util.getFirstTraceOfContext(contextId);
      if (!trace) {
        throw new Error(`Invalid contextId - context not found: ${contextId}`);
      }

      if (needsNewContextId) {
        // update memento
        await mementoSet(TestDDGKeyName, { testFilePath, contextId });
      }

      // trace = dp.util.getFirstTraceOfContext(firstFunctionContext.contextId);
      traceSelection.selectTrace(trace);
      // await sleep(50); // wait a few ticks for `selectTrace` to start taking effect
    }
    // wait for trace file's editor to have opened, to avoid a race condition between the two windows opening
    await getOrOpenTraceEditor(trace);
    await showDDGView();
  });

  // ###########################################################################
  // show/hide code decorations
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showDecorations', () => {
    setShowDeco(true);
  });

  registerCommand(extensionContext, 'dbux.hideDecorations', () => {
    setShowDeco(false);
  });

  // ###########################################################################
  // show/hide nav buttons
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.toggleNavButton',
    toggleNavButton
  );

  // ###########################################################################
  // show/hide error log
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.toggleErrorLog',
    toggleErrorLog
  );

  // ###########################################################################
  // show/hide error log
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.openPracticeLogFolder', () => {
    open(getLogsDirectory());
  });

  // ###########################################################################
  // select trace
  // ###########################################################################

  async function openSelectTraceUI() {
    // input application
    const application = await getSelectedApplicationInActiveEditorWithUserFeedback();
    if (!application) {
      return;
    }
    const { applicationId } = application;

    // input traceId
    // TOTRANSLATE
    let userInput = await window.showInputBox({ placeHolder: 'please input a traceId' });
    if (!userInput) {
      // user canceled selection
      return;
    }

    const dp = allApplications.getById(applicationId).dataProvider;

    let traceId;
    if (userInput.startsWith('c')) {
      // get context
      const contextId = parseInt(userInput.substring(1), 10);
      traceId = dp.util.getFirstTraceOfContext(contextId)?.traceId;
      if (!traceId) {
        await showErrorMessage(`Invalid contextId: ${userInput.substring(1)}`);
        return;
      }
    }
    else if (userInput.startsWith('r')) {
      // get run
      const runId = parseInt(userInput.substring(1), 10);
      traceId = dp.util.getFirstTraceOfRun(runId);
    }
    else if (userInput.startsWith('n')) {
      // get node
      const nodeId = parseInt(userInput.substring(1), 10);
      traceId = dp.util.getDataNode(nodeId)?.traceId;
    }
    else if (userInput.startsWith('v')) {
      // get valueRef
      const refId = parseInt(userInput.substring(1), 10);
      traceId = dp.util.getFirstTraceByRefId(refId)?.traceId;
    }
    else {
      if (userInput.startsWith('t')) {
        userInput = userInput.substring(1);
      }
      traceId = parseInt(userInput, 10);
    }
    if (isNaN(traceId)) {
      // TOTRANSLATE
      await showErrorMessage(`Can't convert ${userInput} into integer`);
      return;
    }

    // select trace
    const trace = dp.collections.traces.getById(traceId);
    if (!trace) {
      // TOTRANSLATE
      await showErrorMessage(`Can't find trace of traceId=${traceId} (applicationId=${applicationId})`);
    }
    else {
      traceSelection.selectTrace(trace);
      emitSelectTraceAction(trace, UserActionType.SelectTraceById, { userInput });
    }
  }

  registerCommand(extensionContext, 'dbux.selectTraceById', openSelectTraceUI);


  // ###########################################################################
  // run + debug
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.runFile', () => runFile(extensionContext));
  registerCommand(extensionContext, 'dbux.debugFile', () => runFile(extensionContext, true));

  // ###########################################################################
  // practice backend
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.backendLogin', async () => {
    // if (process.env.NODE_ENV === 'production') {
    //   throw new Error('This command is currently disabled in Production mode.');
    // }
    const backend = await getProjectManager().getAndInitBackend();
    await backend.login();
    // await installDbuxDependencies();
    // const backend = await getOrCreateProjectManager().getAndInitBackend();
    const data = { installId: 'testIdqwe', hi: 123 };
    // log('storeSurveyResult', data);
    return backend.containers.survey1.storeSurveyResult(data);
  });

  registerCommand(extensionContext, 'dbux.deleteUserEvents', async () => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This command is currently disabled in Production mode.');
    }
    await getProjectManager().deleteUserEvents();
  });

  // ###########################################################################
  // system check
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.systemCheck', async () => {
    let projectManager = getProjectManager(extensionContext);
    await checkSystem(projectManager, getDefaultRequirement(true), true);
  });

  // ###########################################################################
  // open help website
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showHelp', async () => {
    return showHelp();
  });

  // ###########################################################################
  // show outputChannel
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showOutputChannel', async () => {
    showOutputChannel();
    emitShowOutputChannelAction();
  });

  /** ###########################################################################
   * search
   *  #########################################################################*/

  registerCommand(extensionContext, 'dbux.searchContexts', async () => {
    return activateSearch(SearchMode.ByContext);
  });

  registerCommand(extensionContext, 'dbux.searchTraces', async () => {
    return activateSearch(SearchMode.ByTrace);
  });

  registerCommand(extensionContext, 'dbux.searchValues', async () => {
    return activateSearch(SearchMode.ByValue);
  });

  /** ###########################################################################
   * DDG
   *  #########################################################################*/

  registerCommand(extensionContext, 'dbux.showDDGOfContext', async () => {
    const trace = traceSelection.selected;
    if (trace) {
      await showDDGView();
    }
    else {
      await showInformationMessage('No trace selected');
    }
  });
}

/** ###########################################################################
 * helpers
 *  #########################################################################*/

async function activateSearch(mode) {
  searchController.setSearchMode(mode);
  await showGraphView();
}