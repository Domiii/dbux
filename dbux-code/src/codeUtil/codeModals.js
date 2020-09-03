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
  const result = await window.showInformationMessage(message, messageCfg, ...buttons);
  if (result === undefined) {
    await cancelCallback?.();
    return null;
  }
  return result && await btnConfig[result]?.() || null;
}

export async function showWarningMessage(message, btnConfig = EmptyObject, messageCfg = EmptyObject, cancelCallback) {
  const result = await window.showWarningMessage(message, messageCfg, ...Object.keys(btnConfig));
  if (result === undefined) {
    await cancelCallback?.();
    return null;
  }
  return result && await btnConfig[result]?.() || null;
}

export async function showErrorMessage(message, btnConfig, messageCfg = EmptyObject) {
  const result = await window.showErrorMessage(message, messageCfg, ...Object.keys(btnConfig));
  return await result && btnConfig[result]?.() || null;
}