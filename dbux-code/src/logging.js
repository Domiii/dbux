import {
  window
} from 'vscode';
import { onLogError } from '@dbux/common/src/log/logger';
import { showOutputChannel } from './projectViews/projectViewsController';
import { showErrorMessage } from './codeUtil/codeModals';
import { showHelp } from './help';
import { translate } from './lang';

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
      [translate('onError.show')]: () => {
        showOutputChannel();
      },
      [translate('onError.suck')]: async () => {
        return showHelp(translate('onError.suckMessage'));
      },
    });
  }
}