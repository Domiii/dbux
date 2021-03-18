import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { onLogError } from '@dbux/common/src/log/logger';
import { showOutputChannel } from './projectViews/projectViewsController';
import { showInformationMessage, showErrorMessage } from './codeUtil/codeModals';
import { showHelp } from './help';
import { translate } from './lang';

let errorLogFlag = true;

export function toggleErrorLog() {
  setErrorLogFlag(!errorLogFlag);
}

export function setErrorLogFlag(val) {
  errorLogFlag = !!val;
  showInformationMessage(`${errorLogFlag ? 'showing' : 'hiding'} all error log.`);
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
    }, EmptyObject, {
      noPrefix: true
    });
  }
}