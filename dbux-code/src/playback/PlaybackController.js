import { Uri, commands } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import applicationCollection from 'dbux-data/src/applicationCollection';
import EventHandlerList from 'dbux-common/src/util/EventHandlerList';
import { navToCode } from '../codeControl/codeNav';
import { TreeViewController } from '../treeView/treeViewController';
import ContextNode from '../treeView/ContextNode';



const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {
  intervalId: number;
  frameId: number;

  constructor(treeViewController: TreeViewController) {
    this.treeViewController = treeViewController;
    this.frameId = 1;
    this.lastFrameId = 1;
    this.treeViewController.onItemClick(this.onTreeItemClick);
    this.appEventHandlers = new EventHandlerList();

    applicationCollection.onSelectionChanged((selectedApps) => {
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
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    if (this.frameId < collectionSize) this.frameId += 1;
    this.gotoTraceById(this.frameId);
    this.revealTraceInTreeViewById(this.frameId);
  }

  previousTrace = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    if (this.frameId > 1) this.frameId -= 1;
    this.gotoTraceById(this.frameId);
    this.revealTraceInTreeViewById(this.frameId);
  }

  previousTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.frameId = this.dataProvider.util.getPreviousTraceInContext(this.frameId).traceId;
    this.gotoTraceById(this.frameId);
    this.revealTraceInTreeViewById(this.frameId);
  }

  nextTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    this.frameId = this.dataProvider.util.getNextTraceInContext(this.frameId).traceId;
    this.gotoTraceById(this.frameId);
    this.revealTraceInTreeViewById(this.frameId);
  }

  gotoTraceById = (traceId: number) => {
    const { staticTraceId } = this.dataProvider.collections.traces.getById(traceId);
    const { loc } = this.dataProvider.collections.staticTraces.getById(staticTraceId);
    const filePath = this.dataProvider.queries.programFilePathByTraceId(this.frameId);
    navToCode(Uri.file(filePath), loc);
  }

  revealTraceInTreeViewById = (traceId: number) => {
    const { contextId } = this.dataProvider.collections.traces.getById(traceId);
    this.treeViewController.revealContextById(contextId, true);
  }

  getCollectionSize = () => {
    return this.dataProvider.collections.traces.size;
  }

  onTreeItemClick = (node: ContextNode) => {
    const { traceId } = this.dataProvider.util.getFirstTraceOfContext(node.contextId);
    this.frameId = traceId;
  }

}


// auto playback
// select by button(?)
// decorate unplayed/played traces