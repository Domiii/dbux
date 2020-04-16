import { newLogger } from 'dbux-common/src/log/logger';
import ProjectNodeProvider from './projectNodeProvider';

const { log, debug, warn, error: logError } = newLogger('projectViewController');

let controller;

class ProjectViewController {
  constructor(context) {
    this.treeDataProvider = new ProjectNodeProvider(context, this);
    this.treeView = this.treeDataProvider.treeView;
  }
}

// ###########################################################################
// init
// ###########################################################################

export function initProjectView(context) {
  controller = new ProjectViewController(context);

  // refresh right away
  controller.treeDataProvider.refresh();
}