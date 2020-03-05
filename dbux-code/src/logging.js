import { window } from 'vscode';
import { onLogError } from 'dbux-common/src/log/logger';

export function initLogging() {
  onLogError(onError);
}

function onError(...args) {
  window.showErrorMessage(args.join(' '));
}