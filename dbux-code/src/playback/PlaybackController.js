import { Uri, commands } from 'vscode';
import applicationCollection from 'dbux-data/src/applicationCollection';
import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import TracePlayback from 'dbux-data/src/playback/TracePlayback';
import { goToCodeLoc, goToTrace } from '../codeNav';

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
    if (!this.trace) return;
    this.trace = this.tracePlayback.getPreviousTraceInOrder(this.trace) || this.trace;
    goToTrace(this.trace);
  }

  nextTrace = () => {
    if (!this.trace) this.trace = this.tracePlayback.getFirstTraceInOrder();
    if (!this.trace) return;
    this.trace = this.tracePlayback.getNextTraceInOrder(this.trace) || this.trace;
    goToTrace(this.trace);
  }

  previousTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.trace = this.dataProvider.util.getPreviousTraceInContext(this.traceId);
    this.traceId = this.trace.traceId;
    goToTrace(this.trace);
  }

  nextTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.trace = this.dataProvider.util.getPreviousTraceInContext(this.traceId);
    this.traceId = this.trace.traceId;
    goToTrace(this.trace);
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
