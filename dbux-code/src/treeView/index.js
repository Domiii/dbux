import { newLogger } from 'dbux-common/src/log/logger';
import { window } from 'vscode';
import { EventNodeProvider } from './treeData.js';


const { log, debug, warn, error: logError } = newLogger('TreeView');

let eventLogProvider

export function initTreeView(context, dataProvider){

  eventLogProvider = new EventNodeProvider(dataProvider);
  window.registerTreeDataProvider('dbuxEvents', eventLogProvider);

  dataProvider.onData('executionContexts', eventLogProvider.update)

  return eventLogProvider
  
}

export function refreshTreeView(){
  eventLogProvider.refresh()
}