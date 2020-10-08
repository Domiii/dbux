import { window, ExtensionContext, commands } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import { compareTraces } from '@dbux/data/src/traceSelection/relevantTraces';
import traceSelection from '@dbux/data/src/traceSelection';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { getCursorLocation } from '../codeUtil/codeNav';
import { getTracesAt } from '../helpers/codeRangeQueries';
import { compareTraceInner } from '../codeUtil/codeRangeUtil';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

/**
 * @param {Trace} t1 
 * @param {Trace} t2 
 */
function isTracesInSameContext(t1, t2) {
  return t1.applicationId === t2.applicationId && t1.contextId === t2.contextId;
}

export default class TracesAtCursor {
  /**
   * @type {Array<Trace>}
   */
  allTraces;
  /**
   * @param {ExtensionContext} context 
   */
  constructor(context) {
    this.allTraces = [];
    this.needRefresh = true;
    this.index = 0;

    // dispose on de-active
    context.subscriptions.push(
      window.onDidChangeTextEditorSelection(() => {
        this.needRefresh = true;
        this.updateSelectTraceAtCursorButton();
      })
    );
  }

  /**
   * Find all traceAtCursor and sort when `needRefresh = true`
   * Steps:
   *    1. Find `most important` trace
   *    2. Find all trace in same context
   *    3. Sort them by range(inner first)
   */
  refresh = () => {
    if (!this.needRefresh) return;
    this.index = 0;
    let allTraces = this.getAllTracesAtCursor();
    this.needRefresh = false;

    // find `most important` trace
    let nearestTrace;
    for (const trace of allTraces) {
      if (!nearestTrace) {
        nearestTrace = trace;
        continue;
      }

      const compareResult = compareTraceInner(trace, nearestTrace);
      if (compareResult < 0) {
        nearestTrace = trace;
      }
      else if (compareResult === 0) {
        // compare by selectedTrace if they are in same range
        if (traceSelection.selected) {
          if (compareTraces(nearestTrace, trace) > 0) {
            nearestTrace = trace;
          }
        }
      }
    }

    // filter out traces in other context
    allTraces = allTraces.filter((t) => {
      return isTracesInSameContext(t, nearestTrace);
    });

    // TODO: [performance] only sort them when next or previous is called
    this.allTraces = allTraces.sort(compareTraceInner);
  }

  get() {
    // need to refresh if this.sortedTraces is expired
    if (this.needRefresh) {
      this.refresh();
    }
    return this.allTraces[this.index] || null;
  }

  getMostInner() {
    // need to refresh if this.sortedTraces is expired
    if (this.needRefresh) {
      this.refresh();
    }
    return this.allTraces[0] || null;
  }

  previous() {
    this.index--;
    // set to last if reach the begin of sortedTraces
    if (this.index < 0) this.index = this.allTraces.length - 1;
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

let tracesAtCursor;

export function getOrCreateTracesAtCursor(context) {
  if (!tracesAtCursor) {
    tracesAtCursor = new TracesAtCursor(context);
  }

  return tracesAtCursor;
}
