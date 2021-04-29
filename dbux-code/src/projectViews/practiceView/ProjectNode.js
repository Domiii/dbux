import { Uri, workspace } from 'vscode';
import { pathGetBasename } from '@dbux/common/src/util/pathUtil';
import sleep from '@dbux/common/src/util/sleep';
import Project from '@dbux/projects/src/projectLib/Project';
import RunStatus, { isStatusRunningType } from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import BugNode from './BugNode';
import { runTaskWithProgressBar } from '../../codeUtil/runTaskWithProgressBar';
import { showInformationMessage } from '../../codeUtil/codeModals';

export default class ProjectNode extends BaseTreeViewNode {
  static makeLabel(project) {
    return project.name;
  }

  /**
   * @type {Project}
   */
  get project() {
    return this.entry;
  }

  get manager() {
    return this.treeNodeProvider.controller.manager;
  }

  get description() {
    return this.project._installed ? 'installed' : '';
  }

  get contextValue() {
    return `dbuxProjectView.projectNode.${RunStatus.getName(this.project.runStatus)}`;
  }

  makeIconPath() {
    switch (this.project.runStatus) {
      case RunStatus.None:
        return '';
      case RunStatus.Busy:
        return 'hourglass.svg';
      case RunStatus.RunningInBackground:
        return 'play.svg';
      case RunStatus.Done:
        return 'dependency.svg';
      default:
        return '';
    }
  }

  buildChildren() {
    // getOrLoadBugs returns a `BugList`, use Array.from to convert to array
    const bugs = Array.from(this.project.getOrLoadBugs());
    return bugs.map(this.buildBugNode.bind(this));
  }

  buildBugNode(bug) {
    return this.treeNodeProvider.buildNode(BugNode, bug);
  }

  async deleteProject() {
    if (isStatusRunningType(this.project.runStatus)) {
      await showInformationMessage('project is running now...');
    }
    else {
      const confirmMessage = `Do you really want to delete the project: ${this.project.name}`;
      const btnConfig = {
        Ok: async () => {
          await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
            progress.report({ message: 'deleting project folder...' });

            // NOTE: we need this sleep because:
            //     (1) file deletion is actually synchronous, (2) progress bar does not start rendering until after first await has returned
            await sleep();

            await this.project.deleteProjectFolder();
            this.treeNodeProvider.refresh();
          }, {
            cancellable: false,
            title: this.project.name,
          });
          await showInformationMessage('Project has been deleted successfully.');
        }
      };
      await showInformationMessage(confirmMessage, btnConfig, { modal: true });
    }
  }

  addToWorkspace() {
    const uri = Uri.file(this.project.projectPath);
    const i = workspace.workspaceFolders?.length || 0;
    workspace.updateWorkspaceFolders(i, null, {
      name: pathGetBasename(this.project.projectPath),
      uri
    });
  }
}