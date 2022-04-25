import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { onLogError } from '@dbux/common/src/log/logger';
import { showOutputChannel } from './projectViews/projectViewsController';
import { showInformationMessage, showErrorMessage } from './codeUtil/codeModals';
import { showHelp } from './help';
import { translate } from './lang';
import { emitShowHideErrorLogNotificationAction } from './userEvents';

let isShowingAllError = true;

export function toggleErrorLog() {
  setErrorLogFlag(!isShowingAllError);
}

export function setErrorLogFlag(val) {
  isShowingAllError = !!val;
  showInformationMessage(`${isShowingAllError ? 'showing' : 'hiding'} all error log.`);
  emitShowHideErrorLogNotificationAction(isShowingAllError);
}

export function initLogging() {
  onLogError(onError);
}

function onError(...args) {
  if (isShowingAllError) {
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