import {
  window
} from 'vscode';

export async function showInformationMessage(message, btnConfig) {
  // suggest to open and use the first application that is selected and currently running.
  const result = await window.showInformationMessage(message, ...Object.keys(btnConfig));
  return await result && btnConfig[result]?.() || null;
}

export async function showWarningMessage(message, btnConfig) {
  // suggest to open and use the first application that is selected and currently running.
  const result = await window.showWarningMessage(message, ...Object.keys(btnConfig));
  return await result && btnConfig[result]?.() || null;
}