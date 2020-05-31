import { window, ExtensionContext, commands } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import { compareTraces } from 'dbux-data/src/traceSelection/relevantTraces';
import traceSelection from 'dbux-data/src/traceSelection';
import { isBeforeCallExpression } from 'dbux-common/src/core/constants/TraceType';
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
    let nearestTrace;
    for (const [id, nextTrace] of allTraces.entries()) {
      const { applicationId, traceId } = nextTrace;
      const dp = allApplications.getById(applicationId).dataProvider;
      if (isBeforeCallExpression(dp.util.getTraceType(traceId))) {
        // skip BCE here to ensure staticTraceId represents the right executing order
      }
      else if (!nearestTrace) {
        // assign if there is not any non-BCE trace yet
        this.index = id;
        nearestTrace = nextTrace;
      }
      else if (nextTrace.staticTraceId < nearestTrace.staticTraceId) {
        // use innerTraces first
        this.index = id;
        nearestTrace = nextTrace;
      }
      else if (nextTrace.staticTraceId === nearestTrace.staticTraceId) {
        // compare if both are inner traces
        if (traceSelection.selected) {
          if (compareTraces(nearestTrace, nextTrace) > 0) {
            this.index = id;
            nearestTrace = nextTrace;
          }
        }
      }
    }
  }

  get() {
    // need to refresh if this.sortedTraces is expired
    if (this.needRefresh) {
      this.refresh();
    }
    return this.allTraces[this.index] || null;
  }

  previous() {
    this.index--;
    // set to last if reach the begin of sortedTraces
    if (this.index < 0) this.index = this.allTraces.length;
  }

  next() {
    this.index++;
    // set to zero if reach the end of sortedTraces
    if (this.index >= this.allTraces.length) this.index = 0;
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