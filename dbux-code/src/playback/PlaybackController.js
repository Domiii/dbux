import { commands } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import tracePlayback from 'dbux-data/src/playback/TracePlayback';
import { goToTrace } from '../codeNav';

const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {
  tracePlayback = tracePlayback;

  constructor() {
    // Listen on trace changed event
    this.tracePlayback.onTraceChanged(this.handleTraceChanged);
  }

  // ###########################################################################
  // Play functions
  // ###########################################################################

  play = () => {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', true);
    this.tracePlayback.play();
    this.printTracesInfo();
  }

  pause = () => {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', false);
    this.tracePlayback.pause();
  }

  previousTrace = () => {
    this.tracePlayback.previousTrace();
  }

  nextTrace = () => {
    this.tracePlayback.nextTrace();
  }

  // broken
  previousTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.currentTrace = this.dataProvider.util.getPreviousTraceInContext(this.traceId);
    this.traceId = this.currentTrace.traceId;
    goToTrace(this.currentTrace);
  }

  // broken
  nextTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.currentTrace = this.dataProvider.util.getPreviousTraceInContext(this.traceId);
    this.traceId = this.currentTrace.traceId;
    goToTrace(this.currentTrace);
  }

  // ###########################################################################
  // Events
  // ###########################################################################

  /**
   * @param {Trace} trace 
   */
  handleTraceChanged(trace) {
    // if (trace) goToTrace(trace);
  }

  // ###########################################################################
  // Data printer
  // ###########################################################################

  printTracesInfo = () => {
    const apps = allApplications.selection.getAll();
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
    const apps = allApplications.selection.getAll();
    for (let app of apps) {
      log(`== Application ${app.applicationId} ==`);
      let contexts = app.dataProvider.collections.executionContexts.getAll();
      for (let context of contexts) {
        if (!context) continue;
        log(context.contextId, context.runId, context.createdAt);
      }
    }
  }
}
