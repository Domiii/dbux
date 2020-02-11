import {
  workspace,
  ExtensionContext
} from 'vscode';
import Application from 'dbux-data/src/applications/Application';
import allApplications from 'dbux-data/src/applications/allApplications';

/**
 * Add some cool stuff to `dbux-data/src/applications/Application`s for
 * its lifetime inside of VSCode.
 */
export class CodeApplication extends Application {
  _relativeFolder = null;

  getRelativeFolder() {
    if (!this._relativeFolder) {
      this._relativeFolder = workspace.asRelativePath(this.entryPointPath);
    }
    return this._relativeFolder;
  }
}

export function initCodeApplications(context: ExtensionContext) {
  allApplications.DefaultApplicationClass = CodeApplication;
}