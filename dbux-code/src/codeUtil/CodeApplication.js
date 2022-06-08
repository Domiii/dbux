import {
  window,
  workspace,
  ExtensionContext
} from 'vscode';
import Application from '@dbux/data/src/applications/Application';
import allApplications from '@dbux/data/src/applications/allApplications';
import { pathSafe } from '@dbux/common/src/util/pathUtil';
import { pathJoin } from '@dbux/common-node/src/util/pathUtil';
import { getProjectManager } from '../projectViews/projectControl';
import { getCodeDirectory, getDefaultExportDirectory } from './codePath';

/**
 * Add some cool stuff to `dbux-data/src/applications/Application`s for
 * its lifetime inside of VSCode.
 */
export class CodeApplication extends Application {
  init() {
    // register with dbux-projects
    const projectManager = getProjectManager();
    projectManager._handleNewApplication(this);
  }

  getDefaultApplicationExportPath(zip) {
    if (this.importFilePath && this.importFilePath.endsWith('.zip') === zip) {
      return this.importFilePath;
    }
    const applicationName = this.getSafeFileName();
    const projectName = this.projectName && pathSafe(this.projectName) || '';
    let exportPath = pathJoin(getDefaultExportDirectory(), projectName, `${applicationName || '(unknown)'}_data.json`);
    if (zip) {
      exportPath += '.zip';
    }
    return exportPath;
  }
}

/**
 * @param {ExtensionContext} 
 * 
 * hackfix: hot-patch the allApplications object
 */
export function initCodeApplications(/* context */) {
  allApplications.DefaultApplicationClass = CodeApplication;
  allApplications.appRoot = getProjectManager().config.projectsRoot || getCodeDirectory();
  allApplications.projectsRoot = getProjectManager().config.projectsRoot;
  allApplications.samplesRoot = getProjectManager().config.samplesRoot;
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
