import Application from 'dbux-data/src/Application';
import { workspace } from 'vscode';
import applicationCollection from 'dbux-data/src/applicationCollection';

/**
 * Add some cool stuff to `dbux-data/src/Application`s for 
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

export function initCodeApplications(context) {
  applicationCollection.DefaultApplicationClass = CodeApplication;
}