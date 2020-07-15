import { workspace, window } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import { showWarningMessage } from '../codeUtil/codeModals';

function getRelatedAppIds(fpath) {
  return allApplications.selection.data.mapApplicationsOfFilePath(fpath, (app) => app.applicationId);
}

export function initEditedWarning() {
  const documentBlackList = new Set();
  let messageBoxDisposed = true;

  workspace.onDidChangeTextDocument(async (e) => {
    if (!messageBoxDisposed) {
      // Do not show warning if the box already exist
      return;
    }

    if (documentBlackList.has(e.document.fileName)) {
      // ignore if the document is in black list
      return;
    }

    const relatedAppIds = getRelatedAppIds(e.document.fileName);

    if (!relatedAppIds.length) {
      // ignore if no related apps
      return;
    }

    messageBoxDisposed = false;
    await showWarningMessage('[Dbux Warning] Document changed -> code decorations will be inaccurate', {
      [`Don't show again for this file`]: async () => {
        documentBlackList.add(e.document.fileName);
      },
      [`Unselect Apps`]: async () => {
        relatedAppIds.forEach((id) => {
          allApplications.selection.removeApplication(id);
        });
      },
      [`OK`]: () => {}
    });
    messageBoxDisposed = true;
  });
}