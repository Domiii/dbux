import {
  window
} from 'vscode';

import allApplications from '@dbux/data/src/applications/allApplications';
import { showTextDocument } from './codeNav';
import { showWarningMessage } from './codeModals';
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
    const msg = 'Failed. No application running in open file. Exporting first application instead...';
    const firstApp = allApplications.selection.getAll()[0];
    const btns = {
      [`Select ${firstApp.getPreferredName()}`]: async () => {
        await showTextDocument(firstApp.entryPointPath);
        return firstApp;
      }
    };
    await showWarningMessage(msg, btns);
    return firstApp;
  }

  return application;
}