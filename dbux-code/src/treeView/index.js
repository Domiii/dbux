import vscode from 'vscode';
import { EventNodeProvider } from './treeData.js';

const log = (...args) => console.log('[dbux-code][treeView]', ...args)

let eventLogProvider

export function initTreeView(context, dataProvider){

  eventLogProvider = new EventNodeProvider([], dataProvider);
  vscode.window.registerTreeDataProvider('dbuxEvents', eventLogProvider);

  dataProvider.onData('executionContexts', eventLogProvider.update)

  log('Sucessfully "initTreeView".')
  
}

// export function refreshTreeView(){
//   eventLogProvider.refresh()
// }