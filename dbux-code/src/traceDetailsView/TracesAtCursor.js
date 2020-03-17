import { window, ExtensionContext, commands } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import { getSortedReleventTraces } from 'dbux-data/src/traceSelection/relevantTraces';
import Trace from 'dbux-common/src/core/data/Trace';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import { getCursorLocation } from '../codeNav';
import { getTracesAt } from '../helpers/codeRangeQueries';

export default class TracesAtCursor {
  sortedTraces: Array<Trace>;
  /**
   * @param {ExtensionContext} context 
   */
  constructor(context) {
    this.sortedTraces = [];
    this.isCursorMoved = true;
    this.index = 0;

    // subscript cursorMode event
    context.subscriptions.push(
      window.onDidChangeTextEditorSelection(() => {
        this.isCursorMoved = true;
        this.updateSelectTraceAtCursorButton();
      })
    );
  }

  refresh = () => {
    if (!this.isCursorMoved) return;
    window.showInformationMessage('TracesAtCursor.refresh()');
    this.index = 0;
    // TODO: Sort traces of applications individually.
    const allTraces = this.getAllTracesAtCursor();
    const sortedTraces = getSortedReleventTraces(allTraces);
    this.sortedTraces = sortedTraces;
    this.isCursorMoved = false;
  }

  getNext = () => {
    // need to refresh if this.sortedTraces is expired
    if (this.isCursorMoved) {
      this.refresh();
    }

    const nextTrace = this.sortedTraces[this.index];
    this.index++;
    // set to zero if reach the end of sortedTraces
    if (this.index >= this.sortedTraces.length) this.index = 0;

    return nextTrace || null;
  }

  getAllTracesAtCursor = () => {
    const { fpath, pos } = getCursorLocation();
    return allApplications.selection.data.mapApplicationsOfFilePath(
      fpath, (application, programId) => {
        return getTracesAt(application, programId, pos) || EmptyArray;
      }
    );
  }

  /**
   * Show botton of different color depends on whether there is (no) traces at cursor
   */
  updateSelectTraceAtCursorButton = () => {
    if (this.getAllTracesAtCursor().length) {
      commands.executeCommand('setContext', 'dbuxTraceDetailsView.context.hasTracesAtCursor', true);
    }
    else {
      commands.executeCommand('setContext', 'dbuxTraceDetailsView.context.hasTracesAtCursor', false);
    }
  }
}