import vscode from 'vscode';
import { EventNodeProvider } from './treeData.js';

const log = (...args) => console.log('[dbux-code][treeView]', ...args)

const eventLogProvider = new EventNodeProvider([]);
vscode.window.registerTreeDataProvider('dbuxEvents', eventLogProvider);

export function refreshTreeView(){
  eventLogProvider.refresh()
}

export function initTreeView(context, dataProvider){

  dataProvider.onData('executionContexts', function(data){
    log('Get data from dataProvider', data)
  })

  log('Sucessfully "initTreeView".')
  
}