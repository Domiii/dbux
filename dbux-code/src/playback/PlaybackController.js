import { Uri, commands } from 'vscode';
import applicationCollection from 'dbux-data/src/applicationCollection';
import EventHandlerList from 'dbux-common/src/util/EventHandlerList';
import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import TracePlayback from 'dbux-data/src/playback/TracePlayback';
import { navToCode } from '../codeControl/codeNav';
import { TreeViewController } from '../treeView/treeViewController';
import ContextNode from '../treeView/ContextNode';

const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {
  intervalId: number;
  trace: Trace;
  lastTrace: Trace;
  tracePlayback: TracePlayback;

  constructor(treeViewController: TreeViewController) {
    this.treeViewController = treeViewController;
    this.trace = null;
    this.lastTrace = null;
    this.treeViewController.onItemClick(this.onTreeItemClick);
    this.appEventHandlers = new EventHandlerList();

    this.tracePlayback = applicationCollection.selection.data.tracePlayback;

    applicationCollection.selection.onSelectionChanged((selectedApps) => {
      this.updateTrace();
      for (const app of selectedApps) {
        this.appEventHandlers.subscribe(
          app.dataProvider.onData('traces', this.updateTrace.bind(this))
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
    if (!this.trace) return;
    this.trace = this.tracePlayback.getPreviousTraceInOrder(this.trace) || this.trace;
    this.showTrace(this.trace);
    this.revealTraceInTreeView(this.trace);
  }

  nextTrace = () => {
    if (!this.trace) return;
    this.trace = this.tracePlayback.getNextTraceInOrder(this.trace) || this.trace;
    this.showTrace(this.trace);
    this.revealTraceInTreeView(this.trace);
  }

  previousTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.traceId = this.dataProvider.util.getPreviousTraceInContext(this.traceId).traceId;
    this.showTrace(this.traceId);
    this.revealTraceInTreeView(this.traceId);
  }

  nextTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.traceId = this.dataProvider.util.getNextTraceInContext(this.traceId).traceId;
    this.showTrace(this.traceId);
    this.revealTraceInTreeView(this.traceId);
  }

  /**
   * @param {Trace} trace
   */
  showTrace = (trace) => {
    const dp = applicationCollection.getApplication(trace.applicationId).dataProvider;
    const { staticTraceId } = dp.collections.traces.getById(trace.traceId);
    const { loc } = dp.collections.staticTraces.getById(staticTraceId);
    const filePath = dp.queries.programFilePathByTraceId(trace.traceId);
    navToCode(Uri.file(filePath), loc);
  }

  /**
   * @param {Trace} trace
   */
  revealTraceInTreeView = (trace) => {
    const dp = applicationCollection.getApplication(trace.applicationId).dataProvider;
    const { contextId } = dp.collections.traces.getById(trace.traceId);
    this.treeViewController.revealContextById(trace.applicationId, contextId, true);
  }

  getCollectionSize = () => this.dataProvider.collections.traces.size;

  onTreeItemClick = (node: ContextNode) => {
    const { dataProvider } = applicationCollection.getApplication(node.applicationId);
    const { traceId } = dataProvider.util.getFirstTraceOfContext(node.contextId);
    this.traceId = traceId;
  }

  updateTrace = () => {
    log('In updateTraces');
    log('this =', this);
    log('this.trace =', this.trace);
    if (this.trace) {
      // see if original trace is in selected apps
      if (applicationCollection.selection.isApplicationSelected(this.trace.applicationId)) return;
    }
    // try to get first trace in selection
    this.trace = this.tracePlayback.getFirstTraceInOrder();
    log('rootContextsInOrder =', applicationCollection.selection.data.rootContextsInOrder.getAll());
    log('After trying to find first trace, this.trace =', this.trace);
  }
}


// auto playback
// select by button(?)
// decorate unplayed/played traces