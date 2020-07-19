import { ProgressLocation, Uri, workspace, window } from 'vscode';
import { pathGetBasename } from '@dbux/common/src/util/pathUtil';
import sleep from '@dbux/common/src/util/sleep';
import Project from '@dbux/projects/src/projectLib/Project';
import BugRunnerStatus, { isStatusRunningType } from '@dbux/projects/src/projectLib/BugRunnerStatus';
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

  get contextValue() {
    return `dbuxProjectView.projectNode.${BugRunnerStatus.getName(this.status)}`;
  }

  get bugLoadingNode() {
    if (!this._bugLoadingNode) {
      this._bugLoadingNode = new BugLoadingNode();
    }
    return this._bugLoadingNode;
  }

  get status() {
    return this.project.runner.getProjectStatus(this.project);
  }

  makeIconPath() {
    switch (this.status) {
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
      runTaskWithProgressBar(async (progress/* , cancelToken */) => {
        progress.report({ message: 'loading bug list...' });
        await this._buildChindren(progress);
        this.treeNodeProvider.repaint();
      }, {
        cancellable: true,
        location: ProgressLocation.Notification,
        title: `[dbux] ${this.project.name}`
      });
      return [this.bugLoadingNode];
    }
  }

  async _buildChindren(/* progress */) {
    const runner = this.treeNodeProvider.controller.manager.getOrCreateRunner();
    // getOrLoadBugs returns a `BugList`, use Array.from to convert to array
    const bugs = Array.from(await runner.getOrLoadBugs(this.project));
    this.childrenBuilt = true;
    this.children = bugs.map(this.buildBugNode.bind(this));

    this.treeNodeProvider.decorateChildren(this);
    return this.children;
  }

  buildBugNode(bug) {
    return this.treeNodeProvider.buildNode(BugNode, bug);
  }

  async deleteProject() {
    if (isStatusRunningType(this.status)) {
      window.showInformationMessage('[dbux] project is running now...');
    }
    else {
      const confirmMessage = `Do you really want to delete project: ${this.project.name}`;
      const result = await window.showInformationMessage(confirmMessage, { modal: true }, 'Ok');
      if (result === 'Ok') {
        runTaskWithProgressBar(async (progress/* , cancelToken */) => {
          progress.report({ message: 'deleting project folder...' });
          // wait for progress bar to show
          await sleep(100);
          await this.project.deleteProjectFolder();
          this.treeNodeProvider.refresh();
          progress.report({ message: 'Done.' });
        }, {
          cancellable: false,
          location: ProgressLocation.Notification,
          title: `[dbux] ${this.project.name}`
        });
      }
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