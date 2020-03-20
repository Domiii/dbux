import { window, workspace } from 'vscode';
import path from 'path';
import fs from 'fs';
import traceSelection from 'dbux-data/src/traceSelection';
import allApplications from 'dbux-data/src/applications/allApplications';
import { registerCommand } from './commandUtil';

function getRootFolder(fpath) {
  const spl = fpath.split(/[\\/]/, 2);
  return spl[0];
}

export function initUserCommands(context) {
  // dbux.exportApplicationData
  registerCommand(context, 'dbux.exportApplicationData', () => {
    if (!traceSelection.selected) {
      window.showWarningMessage('Could not export dbux application data - no trace selected');
      return;
    }

    const application = allApplications.getById(traceSelection.selected.applicationId);
    // const workspacePath = application.getRelativeFolder();
    // const workspaceFolderName = getRootFolder(workspacePath);
    // workspace.getWorkspaceFolder
    // const folder = path.join(application.entryPointPath.replace(workspacePath, ''), workspaceFolderName);    // won't work on windows because separators of workspace path and application path are different

    const folder = path.dirname(application.entryPointPath);
    const fpath = path.join(folder, '_data.json');
    const data = application.dataProvider.serialize();
    fs.writeFileSync(fpath, JSON.stringify(data));

    window.showInformationMessage(`File saved successfully: ${fpath}`);
  });
}