import { commands, Uri, workspace } from 'vscode';
import fs from 'fs';
import path from 'path';
import { pathGetBasename } from '@dbux/common/src/util/pathUtil';
import { showInformationMessage } from './codeModals';

export function addProjectFolderToWorkspace(project) {
  const uri = Uri.file(project.projectPath);
  const i = workspace.workspaceFolders?.length || 0;
  workspace.updateWorkspaceFolders(i, null, {
    name: pathGetBasename(project.projectPath),
    uri
  });
}

export function isProjectFolderInWorkspace(project) {
  const uri = Uri.file(project.projectPath);
  return workspace.workspaceFolders && Array.from(workspace.workspaceFolders).some((workspaceFolder) => {
    if (workspaceFolder.uri.fsPath === uri.fsPath) {
      return true;
    }
    else {
      return false;
    }
  });
}

/**
 * NOTE: check `isProjectFolderInWorkspace` before asking
 * @param {Project} project 
 * @returns 
 */
export async function askForOpenProjectWorkspace(project) {
  const message = `Project "${project.name}" is currently not in your workspace (which makes it harder to work with it).`;

  const buttons = {};
  if (workspace.workspaceFolders !== undefined) {
    buttons["Add to current workspace"] = async () => {
      addProjectFolderToWorkspace(project);
      return true;
    };
  }
  buttons["Create + open new workspace for project"] = async () => {
    maybeCreateWorkspaceFile(project);
    await commands.executeCommand('vscode.openFolder', Uri.file(getWorkspaceFilePath(project)));
    return true;
  };
  buttons.Continue = () => {
    return true;
  };
  const result = await showInformationMessage(message, buttons, { modal: true });
  return result;
}

export function getWorkspaceFilePath(project) {
  return path.join(project.projectPath, '..', `${project.name}.code-workspace`);
}

export function maybeCreateWorkspaceFile(project) {
  const fpath = getWorkspaceFilePath(project);
  if (!fs.existsSync(fpath)) {
    const content = {
      folders: [
        {
          name: project.name,
          path: `./${project.name}`
        }
      ]
    };
    fs.writeFileSync(fpath, JSON.stringify(content, null, 2));
  }
}