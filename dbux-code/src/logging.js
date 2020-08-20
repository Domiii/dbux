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
      [`Need Help`]: async () => {
        // eslint-disable-next-line max-len
        const msg = `If this error is causing you trouble, you can:\n→ Join Discord to ask for help\n→ If you already have some more information, report an issue on Github\n→ Check out the Dbux website for more information`;
        return showHelp(msg);
      },
    });
  }
}