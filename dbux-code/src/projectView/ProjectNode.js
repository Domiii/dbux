import { ProgressLocation, Uri, workspace } from 'vscode';
import { pathGetBasename } from 'dbux-common/src/util/pathUtil';
import Project from 'dbux-projects/src/projectLib/Project';
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
    return this.project.runner.isProjectActive(this.project);
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

  deleteProject() {
    runTaskWithProgressBar((progress, cancelToken) => {
      return this.project.deleteProjectFolder();
    }, {
      cancellable: false,
      location: ProgressLocation.Notification,
      title: `Deleting project: ${this.project.name}`
    });
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

  async addToWorkspace() {
    const uri = Uri.file(this.project.projectPath);
    const i = workspace.workspaceFolders?.length || 0;
    await workspace.updateWorkspaceFolders(i, null, {
      name: pathGetBasename(this.project.projectPath),
      uri
    });
  }
}