import { Uri, workspace } from 'vscode';
import fs from 'fs';
import path from 'path';
import { pathGetBasename } from '@dbux/common/src/util/pathUtil';

export function addProjectFolderToWorkspace(project) {
  const uri = Uri.file(project.projectPath);
  const i = workspace.workspaceFolders?.length || 0;
  workspace.updateWorkspaceFolders(i, null, {
    name: pathGetBasename(project.projectPath),
    uri
  });
}

export function isProjectFolderInWorkspace(project) {
  const projectFsPath = Uri.file(project.projectPath).fsPath;
  return workspace.workspaceFolders &&
    Array.from(workspace.workspaceFolders)
      .some((workspaceFolder) => {
        if (workspaceFolder.uri.fsPath === projectFsPath) {
          return true;
        }
        else {
          return false;
        }
      });
}

export function getDefaultWorkspaceFilePath(project) {
  return path.join(project.projectPath, '..', `${project.name}.code-workspace`);
}

export function maybeCreateWorkspaceFile(project) {
  const fpath = getDefaultWorkspaceFilePath(project);
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