import { window, workspace } from 'vscode';
import path from 'path';
import fs from 'fs';
// import { stringify as jsonStringify } from 'comment-json';
import allApplications from 'dbux-data/src/applications/allApplications';
import { newFileLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { showTextDocument } from '../codeNav';

const { log, debug, warn, error: logError } = newFileLogger(__filename);

console.log('filename:', __filename);

function serialize(data) {
  // return jsonStringify(data);

  return JSON.stringify(data, null, 2);
}

export function initUserCommands(context) {
  // ###########################################################################
  // exportApplicationData
  // ###########################################################################
  registerCommand(context, 'dbux.exportApplicationData', async () => {
    const exportFolder = path.join(__dirname, '../../analysis/__data__/');

    // if (!traceSelection.selected) {
    //   window.showWarningMessage('Could not export dbux application data - no trace selected');
    //   return;
    // }

    if (!allApplications.getAllCount()) {
      window.showWarningMessage('Could not export dbux data - must run DBUX-instrumented application first');
      return;
    }

    if (allApplications.selection.isEmpty()) {
      window.showWarningMessage('Could not export dbux data - no application selected');
      return;
    }

    const openFilePath = window.activeTextEditor?.document.uri.fsPath;
    // allApplications.selection.data.mapApplicationsOfFilePath(fpath, (application, programId) => {
    // });

    // get first matching application of currently open file
    //    or, if no file is open, just the first application
    const application = allApplications.selection.getAll().find(app => {
      return !openFilePath ||
        !!app.dataProvider.queries.programIdByFilePath(openFilePath);
    });
    const applicationName = await application.guessSafeFileName();
    // const folder = path.dirname(application.entryPointPath);
    // const fpath = path.join(folder, '_data.json');
    const exportFpath = path.join(exportFolder, `${applicationName || '(unknown)'}_data.json`);
    const data = application.dataProvider.serialize();
    fs.writeFileSync(exportFpath, serialize(data));

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
  });
}