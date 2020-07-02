import { ProgressLocation, Uri, workspace, window } from 'vscode';
import { pathGetBasename } from 'dbux-common/src/util/pathUtil';
import sleep from 'dbux-common/src/util/sleep';
import Project from 'dbux-projects/src/projectLib/Project';
import BugRunnerStatus, { isStatusRunningType } from 'dbux-projects/src/projectLib/BugRunnerStatus';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';
import BugNode from './BugNode';
import BugLoadingNode from './BugLoadingNode';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';

export default class ProjectNode extends BaseTreeViewNode {
  static makeLabel(project) {
    return project.name;
  }

  init = () => {
    this.childrenBuilt = false;
    this.contextValue = 'dbuxProjectView.projectNode' + (this.isActivated() ? '.activated' : '');
  }

  /**
   * @type {Project}
   */
  get project() {
    return this.entry;
  }

  get description() {
    return this.project._installed ? 'installed' : '';
  }

  isActivated() {
    return isStatusRunningType(this.project.runner.getProjectStatus(this.project));
  }

  makeIconPath() {
    const status = this.project.runner.getProjectStatus(this.project);
    switch (status) {
      case BugRunnerStatus.None:
        return '';
      case BugRunnerStatus.Busy:
        return 'hourglass.svg';
      case BugRunnerStatus.RunningInBackground:
        return 'play.svg';
      case BugRunnerStatus.Done:
        return 'dependency.svg';
      default:
        return '';
    }
  }

  handleClick() {

  }

  buildChildren() {
    if (this.childrenBuilt) {
      return this.children;
    }
    else {
      runTaskWithProgressBar((progress, cancelToken) => {
        progress.report({ message: 'Loading bugs' });
        return this.registLoadBug(progress);
      }, {
        cancellable: true,
        location: ProgressLocation.Notification,
        title: `Loading bugs of project:${this.project.name}`
      });
      return [BugLoadingNode.instance];
    }
  }

  async registLoadBug(progress) {
    const runner = this.treeNodeProvider.controller.manager.getOrCreateRunner();
    const bugs = await runner.getOrLoadBugs(this.project);
    const children = [];
    // progress.report({ message: 'Building Nodes' });
    for (const bug of bugs) {
      children.push(this.buildBugNode(bug));
    }
    this.childrenBuilt = true;
    this.children = children;

    this.treeNodeProvider.decorateChildren(this);
    this.treeNodeProvider.repaint();
    return children;
  }

  buildBugNode(bug) {
    return this.treeNodeProvider.buildNode(BugNode, bug);
  }

  async deleteProject() {
    const confirmMessage = `Do you really want to delete project: ${this.project.name}`;
    const result = await window.showInformationMessage(confirmMessage, { modal: true }, 'Ok');
    if (result === 'Ok') {
      runTaskWithProgressBar(async (progress, cancelToken) => {
        progress.report({ increment: 20, message: 'deleting folder...' });
        // wait for progress bar to show
        await sleep(100);
        await this.project.deleteProjectFolder();
        this.treeNodeProvider.refresh();
        progress.report({ increment: 80, message: 'Done.' });
      }, {
        cancellable: false,
        location: ProgressLocation.Notification,
        title: `Deleting project: ${this.project.name}`
      });
    }
  }

  async addToWorkspace() {
    const uri = Uri.file(this.project.projectPath);
    const i = workspace.workspaceFolders?.length || 0;
    await workspace.updateWorkspaceFolders(i, null, {
      name: pathGetBasename(this.project.projectPath),
      uri
    });
  }
}