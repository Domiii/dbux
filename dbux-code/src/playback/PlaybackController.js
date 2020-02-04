import { newLogger } from 'dbux-common/src/log/logger';
import { navToCode } from '../codeControl/codeNav';
import { getCodePositionFromLoc } from '../util/codeUtil';

import DataProvider from 'dbux-data/src/DataProvider';
import { TreeViewController } from '../treeView/treeViewController';
import ContextNode from '../treeView/ContextNode';

import { Uri, commands } from 'vscode';


const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {
  
  dataProvider: DataProvider;
  intervalId: number;
  frameId: number;

  constructor(dataProvider: DataProvider, treeViewController: TreeViewController){
    this.dataProvider = dataProvider;
    this.treeViewController = treeViewController
    this.frameId = 1;
    this.lastFrameId = 1;

    this.treeViewController.onItemClick(this.onTreeItemClick)
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