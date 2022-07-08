import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { onLogError } from '@dbux/common/src/log/logger';
import { showInformationMessage, showErrorMessage } from './codeUtil/codeModals';
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
    const btns = EmptyObject;
    const messageCfg = EmptyObject;
    const moreCfg = {
      noPrefix: true
    };
    showErrorMessage(args.join(' '), btns, messageCfg, moreCfg);
  }
}