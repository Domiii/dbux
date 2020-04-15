import { window, ExtensionContext, commands } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import { compareTraces } from 'dbux-data/src/traceSelection/relevantTraces';
import traceSelection from 'dbux-data/src/traceSelection';
import Trace from 'dbux-common/src/core/data/Trace';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import { getCursorLocation } from '../codeUtil/codeNav';
import { getTracesAt } from '../helpers/codeRangeQueries';

export default class TracesAtCursor {
  allTraces: Array<Trace>;
  /**
   * @param {ExtensionContext} context 
   */
  constructor(context) {
    this.allTraces = [];
    this.needRefresh = true;
    this.index = 0;

    // subscript cursorMode event
    context.subscriptions.push(
      window.onDidChangeTextEditorSelection(() => {
        this.needRefresh = true;
        this.updateSelectTraceAtCursorButton();
      })
    );
  }

  refresh = () => {
    if (!this.needRefresh) return;
    this.index = 0;
    const allTraces = this.getAllTracesAtCursor();
    this.allTraces = allTraces;
    this.needRefresh = false;

    // update index to `most important trace`
    if (traceSelection.selected) {
      allTraces.forEach((nextTrace, id) => {
        const nearestTrace = this.allTraces[this.index];
        if (nextTrace.staticTraceId > nearestTrace.staticTraceId) {
          // use innerTraces first
          this.index = id;
        }
        else if (nextTrace.staticTraceId === nearestTrace.staticTraceId) {
          // compare if both are inner traces
          if (compareTraces(nearestTrace, nextTrace) > 0) {
            this.index = id;
          }
        }
      });
    }
  }

  getNext = () => {
    // need to refresh if this.sortedTraces is expired
    if (this.needRefresh) {
      this.refresh();
    }

    const nextTrace = this.allTraces[this.index];
    this.index++;
    // set to zero if reach the end of sortedTraces
    if (this.index >= this.allTraces.length) this.index = 0;

    return nextTrace || null;
  }

  getAllTracesAtCursor = () => {
    const where = getCursorLocation();
    if (where) {
      const { fpath, pos } = where;
      return allApplications.selection.data.mapApplicationsOfFilePath(
        fpath, (application, programId) => {
          return getTracesAt(application, programId, pos) || EmptyArray;
        }
      );
    }
    return EmptyArray;
  }

  /**
   * Show botton of different color depends on whether there is (no) traces at cursor
   */
  updateSelectTraceAtCursorButton = () => {
    // TODO: [performance] dont query all trace every time 
    if (this.getAllTracesAtCursor().length) {
      commands.executeCommand('setContext', 'dbuxTraceDetailsView.context.hasTracesAtCursor', true);
    }
    else {
      commands.executeCommand('setContext', 'dbuxTraceDetailsView.context.hasTracesAtCursor', false);
    }
  }
}