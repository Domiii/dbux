import { commands } from 'vscode';

let showAllNavButton;

export function initToolBar() {
  showNavButton(true);
}

export function showNavButton(bool) {
  commands.executeCommand('setContext', 'dbux.context.showNavButton', bool);
  showAllNavButton = bool;
}

export function toggleNavButton() {
  showNavButton(!showAllNavButton);
}