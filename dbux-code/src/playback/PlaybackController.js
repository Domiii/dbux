import { Uri, commands } from 'vscode';
import applicationCollection from 'dbux-data/src/applicationCollection';
import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import TracePlayback from 'dbux-data/src/playback/TracePlayback';
import { navToCode } from '../codeNav';

const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {
  intervalId: number;
  trace: Trace;
  lastTrace: Trace;
  tracePlayback: TracePlayback;

  // TODO: move play functions to tracePlayback

  constructor() {
    this.trace = null;
    this.lastTrace = null;

    this.tracePlayback = new TracePlayback(applicationCollection.selection.data);

    // TODO: add event emitter to tell playing state changed

    applicationCollection.selection.onSelectionChanged((selectedApps) => {
      this.handleApplicationDataChange();
      for (const app of selectedApps) {
        applicationCollection.selection.subscribe(
          app.dataProvider.onData('traces', this.handleApplicationDataChange)
        );
      }
    });
  }

  play = () => {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', true);
    this.intervalId = setInterval(this._onPlay, 1000);
  }

  _onPlay = () => {
    this.lastTrace = this.trace;
    this.nextTrace();
    if (this.trace === this.lastTrace) this.pause();
  }

  pause = () => {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', false);
    clearInterval(this.intervalId);
  }

  previousTrace = () => {
    if (!this.trace) this.trace = this.tracePlayback.getFirstTraceInOrder();
    else this.trace = this.tracePlayback.getPreviousTraceInOrder(this.trace) || this.trace;
    this.showTrace(this.trace);
  }

  nextTrace = () => {
    if (!this.trace) this.trace = this.tracePlayback.getFirstTraceInOrder();
    else this.trace = this.tracePlayback.getNextTraceInOrder(this.trace) || this.trace;
    this.showTrace(this.trace);
  }

  printTracesInfo = () => {
    const apps = applicationCollection.selection.getSelectedApplications();
    for (let app of apps) {
      log(`== Application ${app.applicationId} ==`);
      let traces = app.dataProvider.collections.traces.getAll();
      for (let trace of traces) {
        if (!trace) continue;
        const context = app.dataProvider.collections.executionContexts.getById(trace.contextId);
        log(trace.runId, trace.contextId, trace.traceId, context.createdAt);
      }
    }
  }

  printContextsInfo = () => {
    const apps = applicationCollection.selection.getSelectedApplications();
    for (let app of apps) {
      log(`== Application ${app.applicationId} ==`);
      let contexts = app.dataProvider.collections.executionContexts.getAll();
      for (let context of contexts) {
        if (!context) continue;
        log(context.contextId, context.runId, context.createdAt);
      }
    }
  }

  previousTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.traceId = this.dataProvider.util.getPreviousTraceInContext(this.traceId).traceId;
    this.showTrace(this.traceId);
  }

  nextTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.traceId = this.dataProvider.util.getNextTraceInContext(this.traceId).traceId;
    this.showTrace(this.traceId);
  }

  /**
   * @param {Trace} trace
   */
  showTrace = (trace) => {
    if (!trace) return;
    const dp = applicationCollection.getApplication(trace.applicationId).dataProvider;
    const { staticTraceId } = dp.collections.traces.getById(trace.traceId);
    const { loc } = dp.collections.staticTraces.getById(staticTraceId);
    const filePath = dp.queries.programFilePathByTraceId(trace.traceId);
    navToCode(Uri.file(filePath), loc);
  }

  getCollectionSize = () => this.dataProvider.collections.traces.size;

  handleApplicationDataChange = () => {
    if (this.trace) {
      // see if original trace is in selected apps
      if (!applicationCollection.selection.isApplicationSelected(this.trace.applicationId)) {
        this.trace = null;
      }
    }
  }
}
