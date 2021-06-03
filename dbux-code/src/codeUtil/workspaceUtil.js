import { commands, Uri, workspace } from 'vscode';
import fs from 'fs';
import path from 'path';
import { pathGetBasename } from '@dbux/common/src/util/pathUtil';
import { confirm } from './codeModals';

export function addProjectFolderToWorkspace(project) {
  const uri = Uri.file(project.projectPath);
  const i = workspace.workspaceFolders?.length || 0;
  workspace.updateWorkspaceFolders(i, null, {
    name: pathGetBasename(project.projectPath),
    uri
  });
}

export function getWorkspaceFilePath(project) {
  return path.join(project.projectPath, `${project.name}.code-workspace`);
}

export function isInCorrectWorkspace(project) {
  const uri = Uri.file(getWorkspaceFilePath(project));
  return workspace.workspaceFile?.fsPath === uri.fsPath;
}

export async function openProjectWorkspace(project, askFirst = true) {
  const message = 'You are not in the correct project workspace, do you want to open it?\n' +
    'NOTE: This will reload the VSCode window';
  if (askFirst && !await confirm(message)) {
    return false;
  }
  else {
    maybeCreateWorkspaceFile(project);
    return await commands.executeCommand('vscode.openFolder', Uri.file(getWorkspaceFilePath(project)));
  }
}

export function maybeCreateWorkspaceFile(project) {
  const fpath = getWorkspaceFilePath(project);
  if (!fs.existsSync(fpath)) {
    const content = {
      folders: [
        {
          name: project.name,
          path: "."
        }
      ]
    };
    fs.writeFileSync(fpath, JSON.stringify(content, null, 2));
  }
}