import { newLogger } from 'dbux-common/src/log/logger';
import { navToCode } from '../codeControl/codeNav';
import { getCodePositionFromLoc } from '../util/codeUtil';

import DataProvider from 'dbux-data/src/DataProvider';
import { TreeViewController } from '../treeView/treeViewController';

import { Uri } from 'vscode';


const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {
  
  dataProvider: DataProvider;
  intervalId: number;
  frameId: number;

  constructor(dataProvider: DataProvider, treeViewController: TreeViewController){
    this.dataProvider = dataProvider;
    this.treeViewController = treeViewController
    this.frameId = 1;
  }

  play = () => {
    this.intervalId = setInterval(this.next, 1000);
  }

  stop = () => {
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

  nextTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    const { contextId } = this.dataProvider.collections.traces.getById(this.frameId);
    for (; this.frameId < collectionSize; this.frameId++){
      if (contextId === this.dataProvider.collections.traces.getById(this.frameId).contextId) break;
    }
    this.gotoTraceById(this.frameId);
    this.revealTraceInTreeViewById(this.frameId);
  }

  previousTraceInContext = () => {
    const collectionSize = this.getCollectionSize();
    if (!collectionSize) return;
    const { contextId } = this.dataProvider.collections.traces.getById(this.frameId);
    for (; this.frameId < collectionSize; this.frameId++){
      if (contextId === this.dataProvider.collections.traces.getById(this.frameId).contextId) break;
    }
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
    this.treeViewController.revealContextById(contextId);
  }

  getCollectionSize = () => {
    return this.dataProvider.collections.traces.size;
  }

}