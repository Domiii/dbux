import { window } from 'vscode';
import TraceDetailsDataProvider from './TraceDetailsDataProvider';


let traceDetailsController;

class TraceDetailsController {
  constructor() {
    this.treeDataProvider = new TraceDetailsDataProvider();
    this.treeView = window.createTreeView('dbuxTraceDetailsView', { 
      treeDataProvider: this.treeDataProvider
    });
  }
}

// ###########################################################################
// init
// ###########################################################################

export function initTraceDetailsController() {
  traceDetailsController = new TraceDetailsController();
}