import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import Enum from '@dbux/common/src/util/Enum';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import traceSelection from '@dbux/data/src/traceSelection';
import { newLogger } from '@dbux/common/src/log/logger';
import { mtime } from '@dbux/common-node/src/util/fileUtil';
import { zipToFile } from '@dbux/common-node/src/util/zipUtil';
import { TreeItemCollapsibleState } from 'vscode';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import TraceDetailNode from '../traceDetailNode';
import { makeTreeItem } from '../../../helpers/treeViewHelpers';
import { getDataFolder, lookupDataRootFolder } from '../../../research/researchUtil';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('EdgeAnalysis');

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * config
 * ##########################################################################*/

const AnnotationFileName = 'edgeAnnotations.json';

/** ###########################################################################
 * EdgeStatus
 * ##########################################################################*/

const edgeStatusObj = {
  Good: 1,

  /** ########################################
   * false forks
   * #######################################*/

  PromiseNotNested: 2,
  CBPromisified: 3,
  CB: 4,

  /** ########################################
   * other inaccuracies
   * #######################################*/

  /**
   * Chained, but skipped one or more in chain, usually resulting in unwanted multi chain
   * that should be a single chain.
   */
  Skipped: 11
};

/**
 * @type {Enum | typeof edgeStatusObj}
 */
const EdgeStatus = new Enum(edgeStatusObj);

/** ###########################################################################
 * {@link EdgeAnnotationData}
 * ##########################################################################*/

export class EdgeAnnotationData {
  /**
   * `toRoot` of the edge uniquely identifies it.
   */
  rootId;

  /**
   * @type {EdgeStatus}
   */
  status;

  comment;
}

class AppMeta {
  appDataMtime;
  appDataUuid;
}

class EdgeDataFile {
  /**
   * @type {AppMeta}
   */
  appMeta;

  /**
   * @type {Object.<string, EdgeAnnotationData>}
   */
  annotations;
}

/** ###########################################################################
 * {@link EdgeAnalysisController}
 * ##########################################################################*/

/**
 * Manage annotations of all edges. Store them to a JSON file.
 */
class EdgeAnalysisController {
  /**
   * @type {EdgeDataFile}
   */
  _data = null;

  /**
   * @type {TraceDetailNode}
   */
  node;

  constructor(node) {
    this.node = node;
  }

  /** ###########################################################################
   * getters
   * ##########################################################################*/

  get treeNodeProvider() {
    return this.node.treeNodeProvider;
  }

  get app() {
    return this.node.app;
  }

  get trace() {
    return this.node.trace;
  }

  get dp() {
    return this.node.dp;
  }

  get dataFolder() {
    return getDataFolder();
  }


  get currentEdgeRootId() {
    return this.trace.rootContextId;
  }

  get currentEdge() {
    const rootId = this.currentEdgeRootId;
    return rootId && this.getEdge(rootId) || null;
  }

  get hasData() {
    return !!this.appProjectName;
  }

  get appProjectName() {
    return this.app?.projectName || null;
  }

  /** ###########################################################################
   * annotations
   * ##########################################################################*/

  makeEdgeDescription(rootId) {
    const annotation = this.getEdgeAnnotation(rootId);
    const { status, comment } = annotation || EmptyObject;
    const { edgeType } = this.getEdge(rootId) || EmptyObject;

    const edgeTypeLabel = edgeType && AsyncEdgeType.nameFrom(edgeType);
    const indicator = annotation ? '✔️' : ' ';
    const annoLabel = annotation &&
      `: ${EdgeStatus.nameFrom(status) || ''} ${comment || ''}` ||
      '';

    return `${indicator} [${edgeTypeLabel}] ${rootId}${annoLabel}`;
  }

  getAllEdgesSorted() {
    const { dp } = this;
    let edges = dp.collections.asyncEvents.getAllActual();

    // copy before sort - see: https://stackoverflow.com/a/9592755
    edges = Array.prototype.slice.call(edges || EmptyArray);

    return edges.sort((a, b) => {
      const aRoot = a.toRootContextId;
      const bRoot = b.toRootContextId;
      const aAnno = this.getEdgeAnnotation(aRoot);
      const bAnno = this.getEdgeAnnotation(bRoot);

      // 1. not annotated before annotated
      if (!!aAnno !== !!bAnno) {
        return !!aAnno - !!bAnno;
      }

      // 2. FORKs before CHAINs
      if (a.edgeType !== b.edgeType) {
        return b.edgeType - a.edgeType;
      }

      // 3. sort by order of occurrence
      return aRoot - bRoot;
    });
  }

  /**
   * @return {EdgeAnnotationData}
   */
  getEdgeAnnotation(rootId) {
    return this.getAllAnnotations()?.[rootId];
  }

  getEdge(rootId) {
    return this.dp.indexes.asyncEvents.to.getUnique(rootId);
  }

  setEdgeAnnotation(rootId, annotation) {
    if (!this.hasData) {
      // can't do anything right now
      throw new Error(`cannot setEdgeAnnotation if !hasData`);
    }

    const annotations = this.getAllAnnotations();
    annotations[rootId] = merge(annotations[rootId] || {}, annotation);
    this.writeAnnotationsToFile(annotations);
  }

  /** ###########################################################################
   * serialization
   * ##########################################################################*/

  makeFilePath() {
    const { dataFolder, appProjectName } = this;
    if (!appProjectName) {
      return null;
    }
    return pathResolve(dataFolder, appProjectName, AnnotationFileName);
  }

  /**
   * @return {Object.<string, EdgeAnnotationData>}
   */
  getAllAnnotations() {
    if (this._data) {
      return this._data;
    }
    this._data = this.readDataFile();
    
    return this._data?.annotations;
  }

  /**
   * @param {Object.<string, EdgeAnnotationData>} annotations
   */
  writeAnnotationsToFile(annotations) {
    if (this._data) {
      this._data.annotations = annotations;
    }
    this.writeDataFile(this._data);
  }

  /**
   * @return {EdgeDataFile}
   */
  readDataFile() {
    const fpath = this.makeFilePath();
    if (!fpath) { return null; }

    if (!existsSync(fpath)) {
      // create empty file
      this.writeDataFile({});
    }

    const serialized = readFileSync(fpath, 'utf8');
    return JSON.parse(serialized);
  }

  /**
   * @param {EdgeDataFile} data 
   */
  writeDataFile(data) {
    const fpath = this.makeFilePath();
    if (!fpath) { throw new Error(`cannot write before data is ready`); }

    const serialized = JSON.stringify(data);
    return writeFileSync(fpath, serialized, 'utf8');
  }

  /** ###########################################################################
   * application events
   * NOTE: we don't need most of this, 
   * since its already taken care of by the {@link TraceDetailsNodeProvider}
   * ##########################################################################*/

  refresh = () => {
    //   this.treeNodeProvider.refresh();
  }

  // refreshOnData = makeDebounce(() => {
  //   this.refresh();
  // }, 100);

  initOnActivate() {
    // reset + lookup data root folder again
    this._data = null;
    lookupDataRootFolder();


    // // add data event handlers
    // this.addDisposable(
    //   allApplications.selection.onApplicationsChanged((selectedApps) => {
    //     this.refreshOnData();
    //     for (const app of selectedApps) {
    //       const unsub = app.dataProvider.onData('asyncEdges', this.refreshOnData);

    //       allApplications.selection.subscribe(unsub);
    //       this.addDisposable(unsub);
    //     }
    //   }),

    //   // // add traceSelection event handler
    //   // traceSelection.onTraceSelectionChanged((/* selected */) => {
    //   //   this.refreshOnData();
    //   // })
    // );
    // this.refresh();
  }

  onApplicationChanged() {
    // TODO: hook this event up
    
    if (!existsSync(zipFpath) || mtime(zipFpath) !== origMtime) {
      // if app data did not exist or has changed since last time, show modal

      // TODO: show modal: offer to also save a copy of app data to separate lfs folder

      // 2. write zipped backup
      zipToFile(inputFpath, zipFpath);

      // TODO: update app meta
      origMtime = mtime(zipFpath);

      // TODO:    -> manage zipped backup of lfs files manually
    }
  }

  // TODO: move dispose logic to BaseTreeItem

  /** ###########################################################################
   * user interactions
   * ##########################################################################*/

  handleClickDefault = async (rootId) => {
    if (rootId === this.currentEdgeRootId) {
      // -> show annotation UI
      // TODO
    }
    else {
      // -> go to first trace in edge's toRoot
      const targetTrace = this.dp.util.getFirstTraceOfContext(rootId);
      if (targetTrace) {
        traceSelection.selectTrace(targetTrace);
      }
    }
  }

  // ###########################################################################
  // dispose
  // ###########################################################################

  addDisposable(...disps) {
    this._disposables.push(...disps);
  }

  dispose(/* silent = false */) {
    const { _disposables } = this;
    this._disposables = [];
    this._isDisposed = true;

    _disposables.forEach((disp) => {
      if (isFunction(disp)) {
        disp();
      }
      else {
        disp.dispose();
      }
    });
  }
}

/** ###########################################################################
 * {@link CurrentEdgeNode}
 * ##########################################################################*/

class CurrentEdgeNode extends TraceDetailNode {
  static makeLabel() { return ''; }

  /**
   * @type {EdgeAnalysisController}
   */
  get controller() {
    return this.parent.controller;
  }

  get edgeRootId() {
    return this.controller.currentEdgeRootId;
  }

  get edge() {
    return this.controller.currentEdge;
  }

  init() {
    if (!this.controller.hasData) {
      this.description = `(no data)`;
    }
    else {
      this.description = this.controller.makeEdgeDescription(this.controller.currentEdgeRootId);
    }
  }

  handleClick() {
    return this.controller.handleClickDefault(this.edgeRootId);
  }
}

/** ###########################################################################
 * 
 * ##########################################################################*/

class EdgeListNode extends TraceDetailNode {
  static makeLabel() { return 'All Edges'; }

  /**
   * @type {EdgeAnalysisController}
   */
  get controller() {
    return this.parent.controller;
  }

  init() {
    this._updateDescription();
  }

  _updateDescription(count) {
    const countLabel = count === undefined ? '' : ` (${count})`;
    this.description = `${this.controller.appProjectName || ''}${countLabel}`;
  }

  canHaveChildren() {
    return this.controller.hasData;
  }

  buildChildren() {
    const nodes = this.controller.getAllEdgesSorted().map(edge => {
      return makeTreeItem(
        '',
        EmptyArray,
        {
          description: this.controller.makeEdgeDescription(edge),
          handleClick: this.controller.handleClickDefault
        }
      );
    });

    this._updateDescription(nodes.length);

    return nodes;
  }
}


/** ###########################################################################
 * main node
 * ##########################################################################*/

export default class EdgeAnalysisNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Edges';
  }

  /**
   * @type {EdgeAnalysisController}
   */
  controller;

  childClasses = [
    CurrentEdgeNode,
    EdgeListNode
  ];

  handleCollapsibleStateChanged() {
    if (this.collapsibleState === TreeItemCollapsibleState.Expanded) {
      // expanded
      const controller = this.controller = new EdgeAnalysisController(this.treeNodeProvider);
      controller.initOnActivate();
    }
    else {
      // collapsed
      this.controller?.dispose();
      this.controller = null;
    }
  }
}
