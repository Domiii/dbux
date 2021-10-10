import sleep from '@dbux/common/src/util/sleep';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import Enum from '@dbux/common/src/util/Enum';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import traceSelection from '@dbux/data/src/traceSelection';
import { newLogger } from '@dbux/common/src/log/logger';
import { getFileSizeSync, mtime } from '@dbux/common-node/src/util/fileUtil';
import { zipFile } from '@dbux/common-node/src/util/zipUtil';
import { TreeItemCollapsibleState, window } from 'vscode';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import TraceDetailNode from '../traceDetailNode';
import { makeTreeItem } from '../../../helpers/treeViewHelpers';
import { getDataFolder, getDataFolderLink, lookupDataRootFolder } from '../../../research/researchUtil';
import { getProjectManager } from '../../../projectViews/projectControl';
import { confirm, showInformationMessage, showWarningMessage } from '../../../codeUtil/codeModals';
import { runTaskWithProgressBar } from '../../../codeUtil/runTaskWithProgressBar';
import { performance } from 'firebase';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('EdgeAnalysis');

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * config
 * ##########################################################################*/

const ResearchProjectName = 'async-js';
const EdgeDataFileName = 'edgeAnnotations.json';
const AppDataZipFileNameSuffix = '.dbuxapp.zip';

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

  _lastAppUuid;

  /**
   * Used for synchronization
   */
  _applicationUpdateVersion = 0;

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
    return getDataFolder(ResearchProjectName);
  }


  get currentEdgeRootId() {
    return this.trace.rootContextId;
  }

  get currentEdge() {
    const rootId = this.currentEdgeRootId;
    return rootId && this.getEdge(rootId) || null;
  }

  get hasProjectAppData() {
    return !!this.appProjectName && !!this.dataFolder;
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
    if (!this.hasProjectAppData) {
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

  get allFolders() {
    return [this.projectDataFolder, this.projectDataFolderLfs];
  }

  get projectDataFolder() {
    const { dataFolder, appProjectName } = this;
    return pathResolve(dataFolder, appProjectName);
  }

  get projectDataFolderLfs() {
    return pathResolve(this.dataFolder, 'lfs');
  }

  makeFilePath() {
    const { appProjectName } = this;
    if (!appProjectName) {
      return null;
    }
    return pathResolve(this.projectDataFolder, EdgeDataFileName);
  }

  makeAppZipFilePath() {
    const { appProjectName } = this;
    if (!appProjectName) {
      return null;
    }
    return pathResolve(this.projectDataFolderLfs, appProjectName + AppDataZipFileNameSuffix);
  }

  getAppMeta() {
    const data = this.getOrReadDataFile();
    return data?.appMeta;
  }

  /**
   * @return {Object.<string, EdgeAnnotationData>}
   */
  getAllAnnotations() {
    const data = this.getOrReadDataFile();
    return data?.annotations;
  }

  /**
   * @param {Object.<string, EdgeAnnotationData>} annotations
   */
  writeAnnotationsToFile(annotations) {
    if (!this._data) {
      this._data = {};
    }
    this._data.annotations = annotations;
    this.writeDataFile(this._data);
  }

  writeAppMeta(appMeta) {
    if (!this._data) {
      this._data = {};
    }
    this._data.appMeta = appMeta;
    this.writeDataFile(this._data);
  }

  /**
   * @return {EdgeDataFile}
   */
  getOrReadDataFile() {
    if (this._data) {
      return this._data;
    }

    const fpath = this.makeFilePath();
    if (!fpath) { return null; }

    if (!existsSync(fpath)) {
      // create empty file, and make sure, directories are present
      this.allFolders.forEach(f => mkdirSync(f, { recursive: true }));
      this.writeDataFile({});
    }

    const serialized = readFileSync(fpath, 'utf8');
    return this._data = JSON.parse(serialized);
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

  initOnExpand() {
    // reset + lookup data root folder again
    this._data = null;

    if (this._lastAppUuid !== this.app.uuid) {
      this._lastAppUuid = this.app.uuid;

      this.handleApplicationChanged();
    }


    // // add data event handlers
    // this.addDisposable(
    //   allApplications.selection.onApplicationsChanged((selectedApps) => {
    //     this.refreshOnData();
    //     for (const app of selectedApps) {
    //       const unsub = app.dataProvider.onData('asyncEdges', this.onApplicationChanged);

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

  writeApplicationDataBackup() {
    const { app } = this;

    // WARNING: if any of these functions are changed to async, make sure to properly handle all possible race conditions.
    const zipFpath = this.makeAppZipFilePath();
    const appFilePath = getProjectManager().getApplicationFilePath(app.uuid);

    // write zipped backup
    zipFile(appFilePath, zipFpath);

    // write new mtime
    const appMeta = {
      appDataMtime: mtime(zipFpath),
      appDataUuid: app.uuid
    };

    this.writeAppMeta(appMeta);

    const origSize = getFileSizeSync(appFilePath) / 1024 / 1024;
    const zipSize = getFileSizeSync(zipFpath) / 1024 / 1024;
    const msg = `[Dbux Research] Application data zipped: ${zipSize.toFixed(2)}MB (from ${origSize.toFixed(2)}MB) at "${zipFpath}".`;
    log(msg);
  }

  handleApplicationChanged = async () => {
    if (!this.hasProjectAppData) {
      this._data = null;
      return;
    }
    const applicationUpdateVersion = ++this._applicationUpdateVersion;

    let previousAppMeta = this.getAppMeta();
    const { app } = this;
    const zipFpath = this.makeAppZipFilePath();
    const appFilePath = getProjectManager().getApplicationFilePath(app.uuid);
    const newMTime = mtime(appFilePath);


    // TODO: only get app's data, not .dbuxapp file
    //    -> use userCommands do{Import,Export} for that
    // TODO: don't use mtime. Instead, check if contents have different length or md5 checksum (https://www.npmjs.com/package/md5)
    // TODO: when new app data arrives, don't ask for update right away
    //    -> add a debounce of some 10 seconds to the checker
    //    -> defer asking until bug runner has finished running (NOTE: not accurate for frontend projects)



    if (!previousAppMeta || !existsSync(zipFpath) || newMTime !== previousAppMeta.appDataMtime) {
      // if app data did not exist or has changed since last time, show modal

      // ask whether to save a backup of app data to separate lfs folder
      const askMsg = `App data of "${this.appProjectName}" has changed - Do you want to create new backup?`;
      if (!await confirm(askMsg)) {
        return;
      }

      if (applicationUpdateVersion !== this._applicationUpdateVersion) {
        // application has changed during modal
        showWarningMessage('Application data changed during modal - result ignored.');
        return;
      }

      await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
        progress.report({ message: 'writing backup file...' });

        // NOTE: we need this sleep because:
        //     (1) the operation is synchronous, and
        //     (2) progress bar does not get to start rendering if we don't give it a few extra ticks
        await sleep();

        this.writeApplicationDataBackup();
      });

      // TODO:    -> manage zipped backup of lfs files manually!
    }
  }

  /** ###########################################################################
   * user interactions
   * ##########################################################################*/

  _statusLabel(annotation, status) {
    const s = EdgeStatus.nameFrom(status);
    return annotation.status === status ? `(${s})` : `${s}`;
  }

  handleClickDefault = async (rootId) => {
    if (rootId === this.currentEdgeRootId) {
      // -> show annotation UI

      const annotation = { ...(this.getEdgeAnnotation(rootId) || EmptyObject) };
      let repeat = true;
      let changed = false;
      do {
        const msg = `Categorize edge for toRoot=${rootId}`;
        const btnConfig = {
          // eslint-disable-next-line no-loop-func
          ...Object.fromEntries(EdgeStatus.values.map(status => ([
            this._statusLabel(annotation, status),
            // eslint-disable-next-line no-loop-func
            async () => {
              annotation.status = status;
              changed = true;
              return false;
            }
          ]))),

          // eslint-disable-next-line no-loop-func
          Comment: async () => {
            let { comment } = annotation;
            comment = await window.showInputBox({
              title: 'Edit the edge\'s comment',
              placeHolder: '',
              value: comment || ''
            });
            annotation.comment = comment;
            changed = true;
            return true;
          }
        };
        repeat = await showInformationMessage(msg, btnConfig, { modal: true });
      } while (repeat);

      if (changed) {
        this.setEdgeAnnotation(rootId, annotation);
      }
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
    if (!this.controller?.hasProjectAppData) {
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
    this.description = `${this.controller?.appProjectName || ''}${countLabel}`;
  }

  canHaveChildren() {
    return this.controller?.hasProjectAppData;
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

  _doInit() {
    if (!this.controller) {
      this.controller = new EdgeAnalysisController(this);
    }

    if (!lookupDataRootFolder()) {
      logError(`dataFolder at "${getDataFolderLink()}" is not configured. Unable to load or write data.`);
    }
    else {
      this.controller.initOnExpand();
    }
  }

  handleCollapsibleStateChanged() {
    if (this.collapsibleState === TreeItemCollapsibleState.Expanded) {
      // expanded
      this._doInit();
    }
    else {
      // collapsed
      this.controller?.dispose();
      this.controller = null;
    }
  }

  buildChildren() {
    this._doInit();

    return this.buildChildrenDefault();
  }
}
