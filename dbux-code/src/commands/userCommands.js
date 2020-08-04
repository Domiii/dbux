import { window } from 'vscode';
import path from 'path';
import fs from 'fs';
import isNaN from 'lodash/isNaN';
// import { stringify as jsonStringify } from 'comment-json';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { newFileLogger } from '@dbux/common/src/log/logger';
import { registerCommand } from './commandUtil';
import { showTextDocument } from '../codeUtil/codeNav';
import { getSelectedApplicationInActiveEditorWithUserFeedback } from '../codeUtil/CodeApplication';
import { showGraphView } from '../graphView';
import { initProjectUserCommands } from './projectCommands';
import { setShowDeco } from '../codeDeco';
import { toggleNavButton } from '../toolbar';
import { toggleErrorLog } from '../logging';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newFileLogger(__filename);


export function initUserCommands(extensionContext, projectViewController) {
  // ###########################################################################
  // exportApplicationData
  // ###########################################################################

  async function doExport(application) {
    const exportFolder = path.join(__dirname, '../../analysis/__data__/');
    const applicationName = application.getSafeFileName();
    // const folder = path.dirname(application.entryPointPath);
    // const fpath = path.join(folder, '_data.json');
    if (!fs.existsSync(exportFolder)) {
      fs.mkdirSync(exportFolder);
    }

    const exportFpath = path.join(exportFolder, `${applicationName || '(unknown)'}_data.json`);
    const data = application.dataProvider.serialize();
    fs.writeFileSync(exportFpath, data);

    const btns = {
      Open: async () => {
        await showTextDocument(exportFpath);
      }
    };
    const msg = `File saved successfully: ${exportFpath}`;
    debug(msg);
    const clicked = await window.showInformationMessage(msg,
      ...Object.keys(btns));
    if (clicked) {
      btns[clicked]();
    }
  }

  registerCommand(extensionContext, 'dbux.exportApplicationData', async () => {
    const application = await getSelectedApplicationInActiveEditorWithUserFeedback();
    await doExport(application);
  });


  // ###########################################################################
  // show graph view
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showGraphView', async () => {
    await showGraphView(extensionContext);
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
  // select trace
  // ###########################################################################

  async function openSelectTraceUI() {
    // input application
    const applicationIdByLabel = new Map();
    const labels = [];
    allApplications.selection.getAll().forEach(app => {
      // NOTE: label should be a unique key
      const label = `${app.getPreferredName()} (id: ${app.applicationId})`;
      labels.push(label);
      applicationIdByLabel.set(label, app.applicationId);
    });
    const applicationName = await window.showQuickPick(labels);
    if (!applicationName) {
      // user canceled selection
      return;
    }
    const applicationId = applicationIdByLabel.get(applicationName);

    // input traceId
    const userInput = await window.showInputBox({ placeHolder: 'input a traceId' });
    if (!userInput) {
      // user canceled selection
      return;
    }
    const traceId = parseInt(userInput, 10);
    if (isNaN(traceId)) {
      window.showErrorMessage(`Can't convert ${userInput} into integer`);
      return;
    }

    // select trace
    const dp = allApplications.getById(applicationId).dataProvider;
    const trace = dp.collections.traces.getById(traceId);
    if (!trace) {
      window.showErrorMessage(`Can't find trace of traceId ${traceId} & applicationId ${applicationId}`);
    }
    else {
      traceSelection.selectTrace(trace);
    }
  }

  registerCommand(extensionContext, 'dbux.selectTrace', openSelectTraceUI);

  // ###########################################################################
  // projects
  // ###########################################################################

  initProjectUserCommands(extensionContext, projectViewController);
}