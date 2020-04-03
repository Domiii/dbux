import { window, ExtensionContext, commands } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import { compareTraces } from 'dbux-data/src/traceSelection/relevantTraces';
import traceSelection from 'dbux-data/src/traceSelection';
import Trace from 'dbux-common/src/core/data/Trace';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
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
    if (traceSelection.selected) {
      allTraces.reduce((t1, t2, id) => {
        if (compareTraces(t1, t2) > 0) {
          this.index = id;
          return t2;
        }
        else {
          return t1;
        }
      });
    }
    this.allTraces = allTraces;
    this.needRefresh = false;
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