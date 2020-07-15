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
export async function showInformationMessage(message, btnConfig, messageCfg = EmptyObject) {
  // suggest to open and use the first application that is selected and currently running.
  const result = await window.showInformationMessage(message, messageCfg, ...Object.keys(btnConfig));
  return await result && btnConfig[result]?.() || null;
}

export async function showWarningMessage(message, btnConfig, messageCfg = EmptyObject) {
  // suggest to open and use the first application that is selected and currently running.
  const result = await window.showWarningMessage(message, messageCfg, ...Object.keys(btnConfig));
  return await result && btnConfig[result]?.() || null;
}