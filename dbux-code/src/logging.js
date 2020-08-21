import {
  window
} from 'vscode';
import { onLogError } from '@dbux/common/src/log/logger';
import { showOutputChannel } from './projectView/projectViewController';
import { showErrorMessage } from './codeUtil/codeModals';
import { showHelp } from './help';

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
    showErrorMessage(args.join(' '), {
      [`Show Log`]: () => {
        showOutputChannel();
      },
      [`This sucks!`]: async () => {
        // eslint-disable-next-line max-len
        const msg = `If this error is causing you trouble, you can:\n→ Join Discord and ask for help\n→ Check out the Dbux website for more information\n→ If this is an unexpected error, grab the log, your system's basic information and report an issue on Github`;
        return showHelp(msg);
      },
    });
  }
}