import {
  window
} from 'vscode';
import EmptyObject from 'dbux-common/src/util/EmptyObject';

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