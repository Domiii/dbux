import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import Trace from 'dbux-common/src/core/data/Trace';
import TracePlayback from './playback/TracePlayback';

// ###########################################################################
// RootTracesInOrder
// ###########################################################################

class RootTracesInOrder {
  _rootTracesArray;
  _rootTraceIndexById = new Map();

  /**
   * @param {ApplicationSelectionData} applicationSelectionData 
   */
  constructor(applicationSelectionData) {
    this.applicationSelectionData = applicationSelectionData;
    this._rootTracesArray = [];
  }

  _mergeAll() {
    this._rootTracesArray = [];
    const applications = this.applicationSelectionData.selection.getSelectedApplications();
    const allFirstContexts = applications.map((app) => app.dataProvider.util.getFirstContextsInRuns() || EmptyArray);

    const indexPointers = Array(applications.length).fill(0);
    const contextsCount = allFirstContexts.reduce((sum, arr) => sum + arr.length, 0);

    for (let i = 0; i < contextsCount; i++) {
      let earliestContext = allFirstContexts[0][indexPointers[0]];
      let earliestApplicationIndex = 0;
      for (let j = 1; j < applications.length; j++) {
        const context = allFirstContexts[j][indexPointers[j]];
        if (!context) continue;
        if (context.createdAt < earliestContext.createdAt) {
          earliestContext = context;
          earliestApplicationIndex = j;
        }
      }
      indexPointers[earliestApplicationIndex] += 1;
      const dp = applications[earliestApplicationIndex].dataProvider;
      const trace = dp.indexes.traces.byContext.get(earliestContext.contextId)[0];
      this._addOne(trace);
    }
  }

  
  _handleSelectionChanged = () => {
    const { applicationSelection } = this.applicationSelectionData;
    const selectedApplications = applicationSelection.getSelectedApplications();
  
    for (const app of selectedApplications) {
      applicationSelection.subscribe(
        app.dataProvider.onData('executionContexts', this._addExecutionContexts.bind(this, app))
      );
    }
  }

  _addExecutionContexts(app, contexts) {
    // TODO: [performance] can we incrementally add new contexts only?
    this._mergeAll();
  }

  _makeKey(rootTrace) {
    const { applicationId } = rootTrace;
    return `${applicationId}_${rootTrace.traceId}`;
  }

  _addOne = (rootTrace) => {
    this._rootTracesArray.push(rootTrace);

    const key = this._makeKey(rootTrace);
    this._rootTraceIndexById.set(key, this._rootTracesArray.length - 1);
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  getAll() {
    return this._rootTracesArray;
  }

  getIndex(rootTrace) {
    const key = this._makeKey(rootTrace);
    const index = this._rootTraceIndexById.get(key);
    if (index === undefined) {
      throw new Error('invalid query - context is not a root trace', rootTrace);
    }
    return index;
  }

  getFirstRootTrace() {
    return this._rootTracesArray[0] || null;
  }

  getNextRootTrace(rootTrace: Trace) {
    const order = this.getIndex(rootTrace);
    return this._rootTracesArray[order + 1] || null;
  }

  getPreviousRootTrace(rootTrace: Trace) {
    const order = this.getIndex(rootTrace);
    return this._rootTracesArray[order - 1] || null;
  }
}


// ###########################################################################
// ApplicationSelectionData
// ###########################################################################

/**
 * @callback fileSelectedApplicationCallback
 * @param {Application} application
 * @param {number} programId
 */

/**
 * Encapsulates all data that is related to the set of selected applications;
 * specifically, any data that changes when selected applications change.
 * 
 * Also provides muliti-casted utility methods that work with the dataProviders of all selected applications.
 */
export default class ApplicationSelectionData {
  constructor(applicationSelection) {
    this.applicationSelection = applicationSelection;
    this.rootTracesInOrder = new RootTracesInOrder(this);
    this.tracePlayback = new TracePlayback(this);

    this.applicationSelection._emitter.on('_selectionChanged0', this._handleSelectionChanged);
  }

  get selection() {
    return this.applicationSelection;
  }

  _handleSelectionChanged = () => {
    this.rootTracesInOrder._handleSelectionChanged();
  }

  /**
   * Return amount of applications that have executed given file.
   */
  getApplicationCountAtPath(fpath) {
    const applications = this.selection._selectedApplications;
    return applications.reduce((sum, { dataProvider }) => {
      const programId = dataProvider.queries.programIdByFilePath(fpath);
      return sum + !!programId;
    }, 0);
  }

  /**
   * @param {fileSelectedApplicationCallback} cb
   */
  mapApplicationsOfFilePath(fpath, cb) {
    const applications = this.selection._selectedApplications;
    const results = [];

    for (const application of applications) {
      const { dataProvider } = application;

      const programId = dataProvider.queries.programIdByFilePath(fpath);
      if (!programId) {
        // program did not execute for this application
        continue;
      }

      const result = cb(application, programId);
      if (Array.isArray(result)) {
        results.push(...result);
      }
      else {
        results.push(result);
      }
    }

    return results;
  }
}