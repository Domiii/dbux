import {
  window,
  workspace,
  ExtensionContext
} from 'vscode';
import Application from '@dbux/data/src/applications/Application';
import allApplications from '@dbux/data/src/applications/allApplications';

/**
 * Add some cool stuff to `dbux-data/src/applications/Application`s for
 * its lifetime inside of VSCode.
 */
export class CodeApplication extends Application {
  getRelativeFolder() {
    return workspace.asRelativePath(super.getRelativeFolder());
  }
}

/**
 * @param {ExtensionContext} 
 */
export function initCodeApplications(/* context */) {
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
