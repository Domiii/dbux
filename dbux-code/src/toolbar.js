import { commands } from 'vscode';
import { emitShowHideNavBarButtonsAction } from './userActions';

let showAllNavButton;

export function initToolBar() {
  showNavButton(true);
}

export function showNavButton(bool) {
  showAllNavButton = !!bool;
  commands.executeCommand('setContext', 'dbux.context.showNavButton', showAllNavButton);
  emitShowHideNavBarButtonsAction(showAllNavButton);
}

export function toggleNavButton() {
  showNavButton(!showAllNavButton);
}