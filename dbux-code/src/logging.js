import { window } from 'vscode';
import { onLogError } from '@dbux/common/src/log/logger';
import { showOutputChannel } from './projectView/projectViewController';

let errorLogFlag = true;

export function toggleErrorLog() {
  setErrorLogFlag(!errorLogFlag);
}

export function setErrorLogFlag(val) {
  errorLogFlag = !!val;
  window.showInformationMessage(`${errorLogFlag ? 'showing' : 'hiding'} all error log.`);
}

export function initLogging() {
  onLogError(onError);
}

function onError(...args) {
  if (errorLogFlag) {
    window.showErrorMessage(args.join(' '));
    showOutputChannel();
  }
}