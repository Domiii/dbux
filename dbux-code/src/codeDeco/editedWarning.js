import { workspace } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import { newLogger } from '@dbux/common/src/log/logger';
import { showWarningMessage } from '../codeUtil/codeModals';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('EditedWarning');

function getRelatedAppIds(fpath) {
  return allApplications.selection.data.mapApplicationsOfFilePath(fpath, (app) => app.applicationId);
}

const documentBlackList = new Set();
let messageBoxDisposed = true;

async function handleTextDocumentChanged(e) {
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
  try {
    await showWarningMessage('[Dbux Warning] Document changed -> code decorations will be inaccurate', {
      [`Don't show again for this file`]: () => {
        documentBlackList.add(e.document.fileName);
      },
      [`Unselect Apps`]: () => {
        relatedAppIds.forEach((id) => {
          allApplications.selection.removeApplication(id);
        });
      },
      [`OK`]: () => { }
    });
  }
  finally {
    messageBoxDisposed = true;
  }
}

function _errWrap(f) {
  return async (...args) => {
    try {
      return await f(...args);
    }
    catch (err) {
      logError(err);
      return err;
    }
  };
}

export function initEditedWarning() {
  workspace.onDidChangeTextDocument(_errWrap(handleTextDocumentChanged));
}