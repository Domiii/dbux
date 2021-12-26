import { commands } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';

export default class ErrorTraceManager {
  constructor() {
    this._all = [];
    this.index = 0;
  }

  refresh() {
    this.index = 0;
    this._all = allApplications.selection.data.collectGlobalStats((dp) => dp.util.getAllErrorTraces());
    this.updateErrorButton();
  }

  get() {
    return this._all[this.index] || null;
  }

  getLeaves() {
    // TODO: fix this
    return this._all;
  }

  getAll() {
    return this._all;
  }

  next() {
    this.index = (this.index + 1) % this._all.length;
  }

  updateErrorButton() {
    const hasError = !!this._all.length;
    commands.executeCommand('setContext', 'dbux.context.hasError', hasError);
  }

  showError() {
    let trace = this.get();
    if (traceSelection.selected === trace) {
      this.next();
      trace = this.get();
    }
    if (trace) {
      traceSelection.selectTrace(trace);
    }
  }
}