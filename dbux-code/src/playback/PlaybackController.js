import { Uri, commands } from 'vscode';
import applicationCollection from 'dbux-data/src/applicationCollection';
import EventHandlerList from 'dbux-common/src/util/EventHandlerList';
import { newLogger } from 'dbux-common/src/log/logger';
import TracePlayback, { TraceStep } from 'dbux-data/src/playback/TracePlayback';
import { navToCode } from '../codeControl/codeNav';
import { TreeViewController } from '../treeView/treeViewController';
import ContextNode from '../treeView/ContextNode';

const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {
  intervalId: number;
  frameId: number;
  frame: TraceStep;
  lastFrame: TraceStep;
  tracePlayback: TracePlayback;

  constructor(treeViewController: TreeViewController) {
    this.treeViewController = treeViewController;
    this.frame = { applicationId: 1, traceId: 1 };
    this.lastFrame = { applicationId: 1, traceId: 1 };
    this.treeViewController.onItemClick(this.onTreeItemClick);
    this.appEventHandlers = new EventHandlerList();

    this.tracePlayback = applicationCollection.selection.data.tracePlayback;

    applicationCollection.selection.onSelectionChanged((selectedApps) => {
      // this.appEventHandlers.unsubscribe();
      // this.clear();
      // for (const app of selectedApps) {
      //   this.update(app, app.dataProvider.collections.executionContexts.getAll());
      //   this.appEventHandlers.subscribe(
      //     app.dataProvider.onData('executionContexts', this.update.bind(this, app))
      //   );
      // }
    });
  }

  play = () => {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', true);
    this.intervalId = setInterval(this._onPlay, 1000);
  }

  _onPlay = () => {
    this.lastFrameId = this.frameId;
    this.nextTrace();
    if (this.frameId == this.lastFrameId) this.pause();
  }

  pause = () => {
    commands.executeCommand('setContext', 'dbuxPlaybackPlaying', false);
    clearInterval(this.intervalId);
  }

  nextTrace = () => {
    this.tracePlayback.stepNextTraceInOrder(this.frame);
    this.showTraceByFrame(this.frame);
    this.revealTraceInTreeViewByFrame(this.frame);
  }

  previousTrace = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    if (this.frameId > 1) this.frameId -= 1;
    this.showTraceByFrame(this.frameId);
    this.revealTraceInTreeViewByFrame(this.frameId);
  }

  previousTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.frameId = this.dataProvider.util.getPreviousTraceInContext(this.frameId).traceId;
    this.showTraceByFrame(this.frameId);
    this.revealTraceInTreeViewByFrame(this.frameId);
  }

  nextTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.frameId = this.dataProvider.util.getNextTraceInContext(this.frameId).traceId;
    this.showTraceByFrame(this.frameId);
    this.revealTraceInTreeViewByFrame(this.frameId);
  }

  /**
   * @param {TraceStep} frame
   */
  showTraceByFrame = (frame) => {
    const dp = applicationCollection.getApplication(frame.applicationId).dataProvider;
    const { staticTraceId } = dp.collections.traces.getById(frame.traceId);
    const { loc } = dp.collections.staticTraces.getById(staticTraceId);
    const filePath = dp.queries.programFilePathByTraceId(frame.traceId);
    navToCode(Uri.file(filePath), loc);
  }

  /**
   * @param {TraceStep} frame
   */
  revealTraceInTreeViewByFrame = (frame) => {
    const dp = applicationCollection.getApplication(frame.applicationId).dataProvider;
    const { contextId } = dp.collections.traces.getById(frame.traceId);
    this.treeViewController.revealContextById(frame.applicationId, contextId, true);
  }

  getCollectionSize = () => {
    return this.dataProvider.collections.traces.size;
  }

  onTreeItemClick = (node: ContextNode) => {
    const { dataProvider } = applicationCollection.getApplication(node.applicationId);
    const { traceId } = dataProvider.util.getFirstTraceOfContext(node.contextId);
    this.frameId = traceId;
  }

}


// auto playback
// select by button(?)
// decorate unplayed/played traces