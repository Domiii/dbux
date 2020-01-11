import vscode from 'vscode';
import { EventNodeProvider } from './treeData.js';

const log = (...args) => console.log('[dbux-code][treeView]', ...args)

export function initTreeView(context){
  
  const eventLogProvider = new EventNodeProvider([]);
  vscode.window.registerTreeDataProvider('dbuxEvents', eventLogProvider);

  log('Sucessfully "initTreeView".')
}