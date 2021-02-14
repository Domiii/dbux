import {
  window
} from 'vscode';

import allApplications from '@dbux/data/src/applications/allApplications';
// import { showTextDocument } from './codeNav';
import { showInformationMessage } from './codeModals';
import { getSelectedApplicationInActiveEditor } from './CodeApplication';


export async function getSelectedApplicationInActiveEditorWithUserFeedback() {
  if (!allApplications.getAllCount()) {
    window.showWarningMessage('Failed. You have not run any Dbux-enabled application.');
    return null;
  }

  if (allApplications.selection.isEmpty()) {
    window.showWarningMessage('Failed. You have not selected any Dbux-enabled application in the "Applications" view.');
    return null;
  }

  const application = getSelectedApplicationInActiveEditor();

  if (!application) {
    // suggest to open and use the first application that is selected and currently running.
    const apps = allApplications.selection.getAll();
    if (apps.length > 1) {
      const msg = 'No application running in open file. Please select application...';
      const btns = Object.fromEntries(
        apps.map(app => [`${app.getPreferredName()}`, async () => {
          // await showTextDocument(app.entryPointPath);
          return app;
        }])
      );
      return await showInformationMessage(msg, btns);
    }
    else {
      const firstApp = apps[0];
      return firstApp;
    }
  }

  return application;
}