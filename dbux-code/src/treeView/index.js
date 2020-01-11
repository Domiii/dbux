import vscode from 'vscode';
import { EventNodeProvider } from './treeData.js';

const log = (...args) => console.log('[dbux-code][treeView]', ...args)

const eventLogProvider = new EventNodeProvider([]);
vscode.window.registerTreeDataProvider('dbuxEvents', eventLogProvider);

export { eventLogProvider }

export function initTreeView(context){

  log('Sucessfully "initTreeView".')
  
}