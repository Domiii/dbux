import { commands } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

export default class ErrorTraceManager {
  constructor() {
    this._all = [];
    this._leaves = [];
    this.index = 0;
    this._leavesNeedUpdate = false;
  }

  refresh() {
    this.index = 0;
    this._all = allApplications.selection.data.collectGlobalStats((dp) => dp.util.getAllErrorTraces());
    this._leavesNeedUpdate = true;
    this.updateErrorButton();
  }

  /**
   * @returns {Trace[]}
   */
  getLeaves() {
    if (this._leavesNeedUpdate) {
      this._findLeaves();
      this._leavesNeedUpdate = false;
    }
    return this._leaves;
  }

  getErrorsByLeaf(leaf) {
    return this._errorsByLeaf.get(leaf);
  }

  getAll() {
    return this._all;
  }

  get() {
    return this._leaves[this.index] || null;
  }

  next() {
    this.index = (this.index + 1) % this._leaves.length;
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

  _findLeaves() {
    const potentialLeaves = new Set(this._all);
    this._errorsByLeaf = new Map();
    for (let i = this._all.length - 1; i >= 0; --i) {
      const trace = this._all[i];
      const dp = allApplications.getById(trace.applicationId).dataProvider;
      if (potentialLeaves.has(trace)) {
        potentialLeaves.delete(trace);
        const errorsOnStack = [];
        let currentTrace = dp.util.getCallerOrSchedulerTraceOfContext(trace.contextId);
        while (currentTrace) {
          const errorInContext = dp.indexes.traces.errorByContext.get(currentTrace.contextId) || EmptyArray;
          for (const errorTrace of errorInContext) {
            if (potentialLeaves.has(errorTrace)) {
              potentialLeaves.delete(errorTrace);
              errorsOnStack.push(errorTrace);
            }
          }
          currentTrace = dp.util.getCallerOrSchedulerTraceOfContext(currentTrace.contextId);
        }
        this._errorsByLeaf.set(trace, errorsOnStack);
      }
    }
    this._leaves = Array.from(this._errorsByLeaf.keys());
  }
}