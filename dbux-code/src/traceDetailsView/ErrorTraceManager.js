import { commands } from 'vscode';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';

export default class ErrorTraceManager {
  constructor() {
    this._all = [];
    this.index = 0;
  }

  refresh() {
    this.index = 0;
    const apps = allApplications.selection.getAll();
    this._all = apps.map(app => app.dataProvider.util.getAllErrorTraces() || EmptyArray).flat();
    this.updateErrorButton();
  }

  get() {
    return this._all[this.index] || null;
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