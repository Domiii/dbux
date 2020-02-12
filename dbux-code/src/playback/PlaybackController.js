import { commands } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import tracePlayback from 'dbux-data/src/playback/tracePlayback';
import { goToTrace } from '../codeNav';

const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {

  constructor() {
    tracePlayback.onPause(this.handlePause);
  }

  // ###########################################################################
  // Play functions
  // ###########################################################################

  play = () => {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', true);
    tracePlayback.play();
    this.printTracesInfo();
  }

  pause = () => {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', false);
    tracePlayback.pause();
  }

  previousTrace = () => {
    tracePlayback.gotoPreviousTrace();
  }

  nextTrace = () => {
    tracePlayback.gotoNextTrace();
  }

  previousTraceInContext = () => {
    tracePlayback.gotoPreviousParentContext();
  }

  nextTraceInContext = () => {
    tracePlayback.gotoNextParentContext();
  }

  // ###########################################################################
  // Events
  // ###########################################################################

  handlePause() {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', false);
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
