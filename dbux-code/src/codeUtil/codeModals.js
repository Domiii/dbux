import {
  window
} from 'vscode';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

/**
 * Example to render a modal with one button "Open Editor":
```
showInformationMessage(value, {
  async 'Open Editor'() {
    const doc = await workspace.openTextDocument({ content: value });
    await window.showTextDocument(doc.uri);
  }
}, { modal: true });
```
 */
export async function showInformationMessage(message, btnConfig = EmptyObject, messageCfg = EmptyObject, cancelCallback) {
  const buttons = Object.keys(btnConfig);
  if (messageCfg?.modal && process.platform === 'darwin') {
    // for some reason, on MAC, modal buttons are reversed :(
    buttons.reverse();
  }
  const result = await window.showInformationMessage(`[Dbux] ${message}`, messageCfg, ...buttons);
  if (result === undefined) {
    return await cancelCallback?.();
  }
  const cbResult = await btnConfig[result]?.();
  return cbResult === undefined ? null : cbResult;
}

export async function showWarningMessage(message, btnConfig = EmptyObject, messageCfg = EmptyObject, cancelCallback) {
  const result = await window.showWarningMessage(`[Dbux] ${message}`, messageCfg, ...Object.keys(btnConfig));
  if (result === undefined) {
    await cancelCallback?.();
    return null;
  }
  const cbResult = await btnConfig[result]?.();
  return cbResult === undefined ? null : cbResult;
}

export async function showErrorMessage(message, btnConfig, messageCfg = EmptyObject, moreConfig = EmptyObject) {
  const prefix = moreConfig.noPrefix ? '' : '[Dbux] ';
  const result = await window.showErrorMessage(`${prefix}${message}`, messageCfg, ...Object.keys(btnConfig));
  const cbResult = await btnConfig[result]?.();
  return cbResult === undefined ? null : cbResult;
}

/**
 * @param {string} msg 
 * @param {boolean} [modal] 
 * @returns {Promise<boolean|null>} A boolean indicates the result of confirmation, or null if it is canceled.
 */
export async function confirm(msg, modal = true) {
  // TOTRANSLATE
  const confirmText = 'Yes';
  const refuseText = 'No';
  const cancelText = 'Cancel';

  const btnConfig = Object.fromEntries([confirmText, refuseText].map(t => [t, () => t]));
  if (!modal) {
    btnConfig[cancelText] = () => cancelText;
  }
  const result = await showInformationMessage(msg, btnConfig, { modal });
  if (result === undefined || result === cancelText) {
    return null;
  }
  else {
    return result === confirmText;
  }
}
