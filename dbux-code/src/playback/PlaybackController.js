import { commands } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import TraceType from 'dbux-common/src/core/constants/TraceType';
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
    this.printContextsInfo();
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
      const info = [];
      log(`== Application ${app.applicationId} ==`);
      let traces = app.dataProvider.collections.traces.getAll();
      for (let trace of traces) {
        if (!trace) continue;
        const { runId, contextId, traceId } = trace;
        const type = app.dataProvider.util.getTraceType(traceId);
        const typeName = TraceType.getName(type);
        info.push({ runId, contextId, traceId, typeName });
      }
      console.table(info);
    }
  }

  printContextsInfo = () => {
    const apps = allApplications.selection.getAll();
    for (let app of apps) {
      const info = [];
      log(`== Application ${app.applicationId} ==`);
      let contexts = app.dataProvider.collections.executionContexts.getAll();
      for (let context of contexts) {
        if (!context) continue;
        const { runId, contextId, parentContextId, schedulerTraceId, parentTraceId} = context;
        info.push({ runId, contextId, parentContextId, schedulerTraceId, parentTraceId });
      }
      console.table(info);
    }
  }
}
