import {
  window,
  workspace,
  ExtensionContext
} from 'vscode';
import Application from 'dbux-data/src/applications/Application';
import allApplications from 'dbux-data/src/applications/allApplications';
import { showTextDocument } from './codeNav';
import { showWarningMessage } from './codeModals';

/**
 * Add some cool stuff to `dbux-data/src/applications/Application`s for
 * its lifetime inside of VSCode.
 */
export class CodeApplication extends Application {
  getRelativeFolder() {
    return workspace.asRelativePath(super.getRelativeFolder());
  }
}

export function initCodeApplications(context: ExtensionContext) {
  allApplications.DefaultApplicationClass = CodeApplication;
}

export function getSelectedApplicationInActiveEditor() {
  const openFilePath = window.activeTextEditor?.document.uri.fsPath;
  // allApplications.selection.data.mapApplicationsOfFilePath(fpath, (application, programId) => {
  // });

  // get first matching application of currently open file
  //    or, if no file is open, just the first application
  const application = allApplications.selection.getAll().find(app => {
    return !openFilePath ||
      !!app.dataProvider.queries.programIdByFilePath(openFilePath);
  });
  return application;
}


export async function getSelectedApplicationInActiveEditorWithUserFeedback() {
  if (!allApplications.getAllCount()) {
    window.showWarningMessage('Failed. Must run DBUX-instrumented application first');
    return null;
  }

  if (allApplications.selection.isEmpty()) {
    window.showWarningMessage('Failed. No application selected');
    return null;
  }

  const application = getSelectedApplicationInActiveEditor();
  

  if (!application) {
    // suggest to open and use the first application that is selected and currently running.
    const msg = 'Failed. No application running in file. Make sure to open a file with an application that ran before!';
    const firstApp = allApplications.selection.getAll()[0];
    const btns = {
      [`Select ${firstApp.getPreferredName()}`]: async () => {
        await showTextDocument(firstApp.entryPointPath);
        return firstApp;
      }
    };
    return showWarningMessage(msg, btns);
  }

  return application;
}