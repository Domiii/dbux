import { window, ProgressLocation } from 'vscode';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';
import BugNode from './BugNode';
import BugLoadingNode from './BugLoadingNode';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';

export default class ProjectNode extends BaseTreeViewNode {
  static makeLabel(project) {
    return project.name;
  }

  init = () => {
    this.contextValue = 'ProjectNode';
    this.childrenBuilt = false;
  }

  get project() {
    return this.entry;
  }

  get isActivated() {
    return false;
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
    progress.report({ message: 'Building Nodes' });
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
}