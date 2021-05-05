import { commands, Uri, workspace } from 'vscode';
import fs from 'fs';
import path from 'path';
import { pathGetBasename } from '@dbux/common/src/util/pathUtil';
import sleep from '@dbux/common/src/util/sleep';
import Project from '@dbux/projects/src/projectLib/Project';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import BugNode from './BugNode';
import { runTaskWithProgressBar } from '../../codeUtil/runTaskWithProgressBar';
import { showInformationMessage, confirm } from '../../codeUtil/codeModals';

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
    return this.treeNodeProvider.buildNode(BugNode, bug, this);
  }

  async deleteProject() {
    const confirmMessage = `Do you really want to delete the project: ${this.project.name}`;
    const btnConfig = {
      Ok: async () => {
        const success = await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
          progress.report({ message: 'deleting project folder...' });

          // NOTE: we need this sleep because:
          //     (1) file deletion is actually synchronous, (2) progress bar does not start rendering until after first await has returned
          await sleep();

          return await this.project.deleteProjectFolder();
        }, {
          cancellable: false,
          title: this.project.name,
        });

        if (success) {
          this.treeNodeProvider.refresh();
          await showInformationMessage('Project has been deleted successfully.');
        }
      }
    };
    await showInformationMessage(confirmMessage, btnConfig, { modal: true });
  }

  // ###########################################################################
  // workspaces
  // ###########################################################################

  addToWorkspace() {
    const uri = Uri.file(this.project.projectPath);
    const i = workspace.workspaceFolders?.length || 0;
    workspace.updateWorkspaceFolders(i, null, {
      name: pathGetBasename(this.project.projectPath),
      uri
    });
  }

  getWorkspaceFilePath(dir = this.project.projectPath) {
    return path.join(dir, `${this.project.name}.code-workspace`);
  }

  isInCorrectWorkspace() {
    const uri = Uri.file(this.getWorkspaceFilePath());
    return workspace.workspaceFile?.fsPath === uri.fsPath;
  }

  maybeCreateWorkspaceFile() {
    const fpath = this.getWorkspaceFilePath();
    if (!fs.existsSync(fpath)) {
      const content = {
        folders: [
          {
            path: "."
          }
        ]
      };
      fs.writeFileSync(fpath, JSON.stringify(content, null, 2));
    }
  }

  async askForOpenWorkspace() {
    const message = 'You are not in the correct project workspace, do you want to open it?\n' +
      'NOTE: This will reload the VSCode window';
    if (await confirm(message)) {
      this.maybeCreateWorkspaceFile();
      await commands.executeCommand('vscode.openFolder', Uri.file(this.getWorkspaceFilePath()));
    }
  }
}