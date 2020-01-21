import { newLogger } from 'dbux-common/src/log/logger';
import { window, EventEmitter } from 'vscode';
import { ContextNodeProvider } from './treeData.js';

const { log, debug, warn, error: logError } = newLogger('TreeView');

let eventLogProvider;

export function initTreeView(context, dataProvider){

  let onChangeTreeData = new EventEmitter();
  eventLogProvider = new ContextNodeProvider(dataProvider, onChangeTreeData);
  window.registerTreeDataProvider('dbuxEvents', eventLogProvider);
  
  // May use this instead of registerTreeDataProvider
  // let treeView = window.createTreeView('dbuxEvents', { treeDataProvider: registedProvider });
  
}

export function refreshTreeView(){
  eventLogProvider.refresh();
}