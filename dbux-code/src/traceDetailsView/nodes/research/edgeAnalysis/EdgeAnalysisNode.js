import { TreeItemCollapsibleState, window } from 'vscode';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import differenceBy from 'lodash/differenceBy';
import isEqual from 'lodash/isEqual';
import NanoEvents from 'nanoevents';
import sleep from '@dbux/common/src/util/sleep';
import { pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import traceSelection from '@dbux/data/src/traceSelection';
import { newLogger } from '@dbux/common/src/log/logger';
import { sha256String } from '@dbux/common-node/src/util/hashUtil';
import Application from '@dbux/data/src/applications/Application';
import allApplications from '@dbux/data/src/applications/allApplications';
import AsyncEventType from '@dbux/common/src/types/constants/AsyncEventType';
import { getPrettyPerformanceDelta, performanceNow, startPrettyTimer } from '@dbux/common/src/util/timeUtil';
import NestedError from '@dbux/common/src/NestedError';
import TraceDetailNode from '../../TraceDetailNode';
import makeTreeItem from '../../../../helpers/makeTreeItem';
// eslint-disable-next-line max-len
import { getCurrentResearch, getDataFolderPath, Research } from '../../../../research/Research';
import { confirm, showErrorMessage, showInformationMessage, showWarningMessage } from '../../../../codeUtil/codeModals';
import { runTaskWithProgressBar } from '../../../../codeUtil/runTaskWithProgressBar';
import { showTextInNewFile } from '../../../../codeUtil/codeNav';
import { makeEdgeTable } from './edgeTable';
import { EdgeStatus, ETC, getExperimentDataFilePath } from './edgeData';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('EdgeAnalysis');

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */



/** ###########################################################################
 * utilities
 * ##########################################################################*/

function selectedModalBtn(selected, text) {
  return selected ? `(${text})` : `${text}`;
}

/**
 * @param {Application} app 
 * @param {[]} files 
 */
function fixFiles(app, files) {
  const commonFolder = app.getAppCommonAncestorPath();
  return Object.fromEntries(Object.entries(files)
    .map(([key, val]) => {
      if (!Array.isArray(val)) {
        return [key, val];
      }
      return [key, val.map(f => pathRelative(commonFolder, f))];
    })
  );
}

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

export class AppMeta {
  appDataHash;
  appDataUuid;
  updatedAt;
}

export class AppStats {
  traceCount;
  aeCounts;
}

export class EdgeDataFile {
  /**
   * @type {AppMeta}
   */
  appMeta;

  appStats;

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
   * @type {TraceDetailNode}
   */
  node;

  /**
   * @type {Research}
   */
  research;

  _dataEvents = new NanoEvents();

  /**
   * Used for synchronization
   */
  _applicationUpdateVersion = 0;

  _disposables = [];

  constructor(node) {
    this.node = node;
    this.research = getCurrentResearch();
    // this._dataEvents.on('events', );
  }

  /** ###########################################################################
   * getters
   * ##########################################################################*/

  get treeNodeProvider() {
    return this.node.treeNodeProvider;
  }

  get app() {
    // NOTE: app depends on trace
    return this.node.trace && this.node.app || null;
  }

  get trace() {
    return this.node.trace;
  }

  get dp() {
    return this.node.dp;
  }


  get currentEdgeRootId() {
    return this.trace.rootContextId;
  }

  get currentEdge() {
    const rootId = this.currentEdgeRootId;
    return rootId && this.getEdge(rootId) || null;
  }

  get dataFolder() {
    return this.research.getResearchDataRoot();
  }

  get hasProjectAppData() {
    return !!this.experimentId && !!this.dataFolder;
  }

  get projectName() {
    return this.app?.projectName || null;
  }

  get experimentId() {
    return this.app?.experimentId || null;
  }

  /** ###########################################################################
   * annotations
   * ##########################################################################*/

  makeEdgeDescription(rootId) {
    const annotation = this.getEdgeAnnotation(rootId);
    const { status, comment } = annotation || EmptyObject;
    const { edgeType } = this.getEdge(rootId) || EmptyObject;

    const edgeTypeLabel = edgeType && AsyncEdgeType.nameFrom(edgeType);
    const indicator = status ? '✔️' : '◯';
    const annoLabel = status &&
      `: ${EdgeStatus.nameFrom(status) || ''} ${comment || ''}` ||
      '';

    return `${indicator} [${edgeTypeLabel}] ${rootId}${annoLabel}`;
  }

  /**
   * @returns {AsyncEvent[]}
   */
  getAllEdgesSorted() {
    const { dp } = this;
    let edges = dp.collections.asyncEvents.getAllActual();

    // fast copy before sort - see: https://stackoverflow.com/a/9592755
    edges = Array.prototype.slice.call(edges || EmptyArray);

    return edges.sort((a, b) => {
      const aRoot = a.toRootContextId;
      const bRoot = b.toRootContextId;
      const aAnno = this.getEdgeAnnotation(aRoot);
      const bAnno = this.getEdgeAnnotation(bRoot);

      // 1. not annotated before annotated
      if (!!aAnno?.status !== !!bAnno?.status) {
        return !!aAnno?.status - !!bAnno?.status;
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

    const annotations = this.getAllAnnotations() || {};
    annotations[rootId] = merge(annotations[rootId] || {}, annotation);
    this.writeAnnotationsToFile(annotations);

    // notify
    this.refreshOnData();
    this._dataEvents.emit('edges', rootId);
  }

  /** ###########################################################################
   * {@link EdgeAnalysisNode#makeAppStats}
   *  #########################################################################*/

  /**
   * @returns {AppStats}
   */
  makeAppStats() {
    const { app, dp } = this;
    const allEdges = dp.collections.asyncEvents.getAllActual();

    // TODO: distinguish between initial and non-initial file executions

    const edges = allEdges
      // ignore file CGRs
      .filter(e => !dp.util.isContextProgramContext(e.toRootContextId));

    const traceCount = dp.collections.traces.getCount();
    const edgeTypeIndexes = {
      [AsyncEventType.Await]: 0,
      [AsyncEventType.Then]: 1,
      [AsyncEventType.Callback]: 2,
      [AsyncEventType.None]: 3
    };

    const aeCounts = edges.reduce((counts, edge) => {
      const type = dp.util.getAsyncRootEventType(edge.toRootContextId);
      const idx = edgeTypeIndexes[type];
      ++counts[idx];
      return counts;
    }, [0, 0, 0, 0] /* a, t, c, other */);

    const edgeTypeCounts = edges.reduce((counts, edge) => {
      const from = edge.fromRootContextId;
      const to = edge.toRootContextId;
      // const toRoot = dp.collections.executionContexts.getById(to);
      // const toAsyncNode = dp.util.getAsyncNode(to);
      const isChain = edge.edgeType === AsyncEdgeType.Chain;
      const isFork = edge.edgeType === AsyncEdgeType.Fork;

      // `hasMultipleParents` can be true, for example, in case of `Promise.all` etc.
      const hasMultipleParents = !!Array.isArray(from);

      const fromParentChains = isChain && !hasMultipleParents && dp.util.getChainFrom(from);
      const chainIndex = fromParentChains && fromParentChains.indexOf(edge);

      // TODO: why exclude "hasMultipleParents"? Can multi-chain and multiple parents not co-exist?
      const isMulti = !hasMultipleParents && chainIndex > 0;

      counts[ETC.C] += isChain && !isMulti;
      counts[ETC.F] += isFork; // FORK
      counts[ETC.MC] += isChain && isMulti; // Multi-Chain
      // counts[ETC.O] += !from;
      // counts[4] += !!toAsyncNode.syncPromiseIds?.length;
      // if (toRoot.syncPromiseIds?.length) {
      //   for (let promiseId of toRoot.syncPromiseIds) {
      //     const roots = Array.from(dp.util.getAllSyncRoots(to)).map(c => c.contextId);
      //     log(`SYNC PROMISE:`, {
      //       promiseId,
      //       roots,
      //       from,
      //       to,
      //     });
      //   }
      // }
      counts[ETC.N] += dp.util.getNestedDepth(to) || 0;
      return counts;
    }, [0, 0, 0, 0, 0, 0, 0, 0]);

    const allNodes = dp.collections.asyncNodes.getAllActual();
    const orphans = allNodes
      .filter(an => !dp.util.getAsyncEdgesTo(an.rootContextId)?.length);
    const nonFileOrphans = orphans
      .filter(an => !dp.util.isContextProgramContext(an.rootContextId));

    // orphan count
    edgeTypeCounts[ETC.O] = nonFileOrphans.length;


    // keep track of file-related data
    const fileEdges = allEdges
      .filter(e => dp.util.isContextProgramContext(e.toRootContextId))
      // .map(e => dp.collections.executionContexts.getById(e.toRootContextId))
      .map(e => dp.util.getProgramContextFilePath(e.toRootContextId));
    const fileRoots = allNodes
      .filter(an => dp.util.isContextProgramContext(an.rootContextId))
      .map(an => dp.util.getProgramContextFilePath(an.rootContextId));
    const fileRootsUnique = Array.from(new Set(fileEdges.concat(fileRoots)));
    // NOTE: files might not always be roots.
    const allFiles = dp.collections.staticProgramContexts.getAllExisting()
      .map(program => program.filePath);
    const fileCount = allFiles.length;
    const fileRootCount = fileRootsUnique.length;
    const files = fixFiles(app, {
      fileCount, fileRootCount, fileEdges, fileRoots, allFileRoots: fileRootsUnique, allFiles
    });

    // take average
    edgeTypeCounts[ETC.N] = edgeTypeCounts[ETC.N] / edges.length;

    // // for debugging purposes
    // const s = edges
    //   .filter(e => !!dp.util.getAsyncNode(e.toRootContextId)?.syncPromiseIds?.length)
    //   .map(e => ([
    //     e.toRootContextId,
    //     // dp.util.getAsyncNode(e.toRootContextId),
    //     dp.util.getAsyncNode(e.toRootContextId).syncPromiseIds
    //   ]));

    return {
      traceCount,
      aeCounts,
      edgeTypeCounts,
      files
    };
  }

  /** ###########################################################################
   * more serialization
   * ##########################################################################*/

  getEdgeDataFilePath() {
    const { experimentId } = this;
    if (!experimentId) {
      return null;
    }
    return getExperimentDataFilePath(experimentId);
  }

  /**
   * @returns {AppMeta}
   */
  getAppMeta() {
    const data = this.getOrReadDataFile();
    return data?.appMeta;
  }

  /**
   * @return {Object.<string, EdgeAnnotationData>}
   */
  getAllAnnotations() {
    const data = this.getOrReadDataFile();
    return data.annotations;
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

  getAllFolders() {
    return [this.research.getExperimentFolder(this.experimentId), this.research.getDataRootLfs()];
  }

  /**
   * @return {EdgeDataFile}
   */
  getOrReadDataFile(forceWrite = false) {
    if (!forceWrite && this._data) {
      return this._data;
    }

    const fpath = this.getEdgeDataFilePath();
    if (!forceWrite && !fpath) { return null; }

    // if (!existsSync(fpath)) {
    // create empty file, and make sure, directories are present
    this.getAllFolders().forEach(f => mkdirSync(f, { recursive: true }));
    // }

    const serialized = existsSync(fpath) && readFileSync(fpath, 'utf8') || null;
    const data = this._data = serialized && JSON.parse(serialized) || {};

    // pre-populate
    const oldAnnotations = data.annotations || EmptyObject;
    const newAnnotations = data.annotations = Object.fromEntries(
      this.getAllEdgesSorted().map(e => {
        const rootId = e.toRootContextId;
        let annotation = oldAnnotations[rootId] || this._makeAnnotation(rootId);
        annotation = this.decorateAnnotation(rootId, annotation);

        return [rootId, annotation];
      })
    );

    // check whether annotations are being discarded
    const outdatedAnnotations = differenceBy(oldAnnotations, newAnnotations, anno => anno.rootId);
    if (outdatedAnnotations?.length) {
      this._data.outdatedAnnotations = outdatedAnnotations;
      logError(`Discarding ${outdatedAnnotations.length} annotations:`, outdatedAnnotations);
    }

    // appStats
    const oldStats = data.appStats;
    const newStats = data.appStats = this.makeAppStats();

    let newMeta;
    if (forceWrite) {
      /**
       * handle appMeta
       * NOTE: here, app (and thus hash) should already be that of the file.
       *    If it does not exist, {@link #checkAppDataUpdate} will take care of it.
       */
      const oldMeta = data.appMeta;
      if (oldMeta) {
        if (!this.makeAndCheckAppHash(oldMeta)) {
          throw new Error(`stored hash does not match application hash`);
        }
      }
      else {
        newMeta = data.appMeta = this.makeAppMeta();
      }
    }

    if (forceWrite ||
      !isEqual(oldAnnotations, newAnnotations) ||
      !isEqual(oldStats, newStats) ||
      newMeta) {
      // write to file
      this.writeDataFile(this._data);
    }

    return this._data;
  }

  decorateAnnotation(rootId, annotation) {
    annotation = { ...annotation };
    const postUpdate = this.dp.util.getAsyncPostEventUpdateOfRoot(rootId);
    annotation.edgeType = postUpdate.type;
    return annotation;
  }

  /**
   * @param {EdgeDataFile} data 
   */
  writeDataFile(data) {
    const fpath = this.getEdgeDataFilePath();
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
    this.treeNodeProvider.refresh();
  }

  refreshOnData = () => {
    this.treeNodeProvider.refreshOnData();
  };

  initOnExpand() {
    // reset + lookup data root folder again
    this._data = null;

    if (!this.app) {
      return;
    }

    if (this._lastAppUuid !== this.app.uuid) {
      this._lastAppUuid = this.app.uuid;
      this.handleApplicationChanged();
    }

    // add data event handlers
    // this.addDisposable(
    //   allApplications.selection.onApplicationsChanged((selectedApps) => {
    //     // this.refreshOnData();
    //     for (const app of selectedApps) {
    //       const unsub = app.dataProvider.onData('asyncEvents', this.refreshOnData);

    //       allApplications.selection.subscribe(unsub);
    //       this.addDisposable(unsub);
    //     }
    //   }),

    //   // // add traceSelection event handler
    //   // traceSelection.onTraceSelectionChanged((/* selected */) => {
    //   //   this.refreshOnData();
    //   // })
    // );
    // this.refreshOnData();
  }

  /** ###########################################################################
   * application data
   * ##########################################################################*/

  /**
   * NOTE: Only hashes part of the app data (should be sufficiently accurate for our purposes).
   * @param {Application} app
   */
  makeRelevantAppDataHash(app) {
    const dp = app.dataProvider;
    const relevantData = [
      'asyncEvents',
      'asyncNodes'
    ];

    const timer = startPrettyTimer();

    const serialized = JSON.stringify(
      dp.serializeCollectionsJson(relevantData)
    );
    const hash = sha256String(serialized);

    timer.print(debug, 'makeRelevantAppDataHash');

    return hash;
  }

  /**
   * @param {AppMeta} oldMeta 
   */
  makeAndCheckAppHash(oldMeta) {
    const hash = this.makeRelevantAppDataHash(this.app);
    const check = oldMeta.appDataHash === hash;
    return check;
    // return {
    //   hash,
    //   check
    // };
  }

  makeAppMeta() {
    const { app } = this;

    // future-work: consider not hashing twice (since we usually would check hash before calling this function)
    const appDataHash = this.makeRelevantAppDataHash(app);

    return {
      // compute hash
      appDataHash,
      appDataUuid: app.uuid,
      updatedAt: Date.now()
    };
  }

  async writeApplicationDataBackup() {
    const { app } = this;

    // write app data
    this.research.exportResearchAppData(app);

    // write new hash et al
    const appMeta = this.makeAppMeta();
    this.writeAppMeta(appMeta);
  }


  checkAppDataUpdate = async () => {
    const applicationUpdateVersion = this._applicationUpdateVersion;

    let oldMeta = this.getAppMeta();
    const { app } = this;
    const zipFpath = this.research.getAppZipFilePath(app);
    const hasAppDataFile = existsSync(zipFpath);

    if (!oldMeta || !hasAppDataFile || !this.makeAndCheckAppHash(oldMeta)) {
      // hash might have changed

      let question;
      if (!oldMeta && hasAppDataFile) {
        // data file gone, but app data file still there
        question = `App data file of "${this.experimentId}" is not hashed but it already exists. Override old app data file?`;
      }
      else {
        // ask whether to save a backup of app data to separate lfs folder
        question = `App data of "${this.experimentId}" has changed - Do you want to create a new backup?`;
      }
      if (!await confirm(question, true, true)) {
        return;
      }

      if (applicationUpdateVersion !== this._applicationUpdateVersion) {
        // application has changed during modal
        if (!await confirm('Application data changed during modal. Are you sure you still want to export?', true, true)) {
          return;
        }
      }

      await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
        progress.report({ message: 'writing backup file...' });
        await sleep();    // TODO: fix this in general -> reported message does not show up before next tick
        await this.writeApplicationDataBackup();
      });
    }
    else {
      await showInformationMessage(
        `App data has not changed since last update (${new Date(oldMeta.updatedAt)})`
      );
    }
  }

  handleApplicationChanged = async () => {
    if (!this.hasProjectAppData) {
      this._data = null;
      return;
    }
    ++this._applicationUpdateVersion;
  }

  /** ###########################################################################
   * data input
   * ##########################################################################*/

  _makeAnnotation(rootId) {
    return {
      rootId
    };
  }

  _statusLabel(annotation, status) {
    const s = EdgeStatus.nameFrom(status);
    return selectedModalBtn(annotation.status === status, s);
  }

  handleClickDefault = async (rootId) => {
    if (rootId === this.currentEdgeRootId) {
      // -> show annotation UI

      let annotation = this.getEdgeAnnotation(rootId) || this._makeAnnotation(rootId);
      annotation = this.decorateAnnotation(rootId, annotation);

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
          [selectedModalBtn('Tricky', !!annotation.tricky)]: async () => {
            annotation.tricky = !annotation.tricky;
            changed = true;
            return true;
          },

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


  /** ###########################################################################
   * {@link EdgeAnalysisController#makeTable}
   * ##########################################################################*/

  async makeTable() {
    const { research } = this;

    const folder = research.getExperimentRoot();
    // const experimentIds = research.getAllExperimentFolders();
    // const experimentAppFiles = experimentIds.map(experimentId => this.research.getAppZipFilePath({ experimentId }));
    const experimentIds = research.getAllExperimentAppFiles()
      .map(f => research.getAppFileExperimentId(f));
    // const experimentFiles = experimentIds.map();
    const missingExperiments = experimentIds
      .filter(experimentId => !existsSync(getExperimentDataFilePath(experimentId)));

    if (missingExperiments.length) {
      const msg = `Missing ${missingExperiments.length} experiments - Proceed (will process them first)?\n${missingExperiments.join('\n')}`;
      if (!await confirm(msg)) {
        return;
      }

      // make sure all experiments are ready
      const progressIncrement = 1 / missingExperiments.length * 100; // percentage
      await runTaskWithProgressBar(async (progress, cancelToken) => {
        for (const experimentId of missingExperiments) {
          try {
            const message = `preparing "${experimentId}" data...`;
            progress.report({
              message,
              increment: progressIncrement
            });
            debug(message);
            await this.prepareExperimentData(experimentId);

            if (cancelToken.isCancellationRequested) {
              break;
            }
          }
          catch (err) {
            throw new NestedError(`prepareExperimentData failed for "${experimentId}"`, err);
            // break;
          }
        }
      }, { cancellable: true });
    }

    // finally, generate table
    const s = makeEdgeTable(folder, experimentIds);
    showTextInNewFile('edgeData.tex', s);
  }

  async prepareExperimentData(experimentId) {
    // clear/unload all
    allApplications.clear();
    await sleep(100); // wait for trace and application unselection events

    // import application
    const app = await this.research.importResearchAppData(experimentId);
    await sleep(100); // wait for application events

    // select first trace
    traceSelection.selectTrace(app.dataProvider.collections.traces.getFirst());
    await sleep(300); // wait for trace selection events

    // generate data
    this.getOrReadDataFile(true);
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
  static makeLabel() { return 'Edge List'; }

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
    this.description = `${this.controller?.experimentId || ''}${countLabel}`;
  }

  canHaveChildren() {
    return this.controller?.hasProjectAppData;
  }

  buildChildren() {
    const nodes = this.controller.getAllEdgesSorted().map(edge => {
      return makeTreeItem(
        '',
        null,
        {
          description: this.controller.makeEdgeDescription(edge.toRootContextId),
          handleClick: this.controller.handleClickDefault.bind(null, edge.toRootContextId)
        }
      );
    });

    this._updateDescription(nodes.length);

    return nodes;
  }
}

/** ###########################################################################
 * button node
 * ##########################################################################*/

class AppDataUpdateNode extends TraceDetailNode {
  static makeLabel() { return 'App Data Update'; }

  /**
   * @type {EdgeAnalysisController}
   */
  get controller() {
    return this.parent.controller;
  }

  handleClick() {
    return this.controller?.checkAppDataUpdate();
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
    AppDataUpdateNode,
    CurrentEdgeNode,
    EdgeListNode
  ];

  _doInit() {
    if (!this.controller) {
      this.controller = new EdgeAnalysisController(this);
    }

    if (!this.controller.research.lookupDataRootFolder()) {
      logError(`dataFolder at "${getDataFolderPath()}" is not configured. Unable to load or write data.`);
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

  async handleClick() {
    if (this.collapsibleState === TreeItemCollapsibleState.Expanded) {
      // generate table
      await this.controller.makeTable();
    }
  }

  buildChildren() {
    this._doInit();

    return this.buildChildrenDefault();
  }
}
