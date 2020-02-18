import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import Trace from 'dbux-common/src/core/data/Trace';

// ###########################################################################
// FirstTracesInOrder
// ###########################################################################

class FirstTracesInOrder {
  _firstTracesArray: Array<Trace>;
  _firstTraceIndexById = new Map();

  /**
   * @param {ApplicationSetData} applicationSetData 
   */
  constructor(applicationSetData) {
    this.applicationSetData = applicationSetData;
    this.applicationSet = applicationSetData.set;
    this._firstTracesArray = [];
  }

  _mergeAll() {
    this._firstTracesArray = [];
    const applications = this.applicationSetData.set.getAll();
    const allFirstContexts = applications.map((app) => app.dataProvider.util.getFirstContextsInRuns() || EmptyArray);

    const indexPointers = Array(applications.length).fill(0);
    const contextsCount = allFirstContexts.reduce((sum, arr) => sum + arr.length, 0);

    for (let i = 0; i < contextsCount; i++) {
      let earliestContext = null;
      let earliestApplicationIndex = null;
      for (let j = 0; j < applications.length; j++) {
        const context = allFirstContexts[j][indexPointers[j]];
        if (!context) continue;
        if (!earliestContext || context.createdAt < earliestContext.createdAt) {
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

  
  _handleApplicationsChanged = () => {
    const applications = this.applicationSet.getAll();
    this._mergeAll();

    for (const app of applications) {
      this.applicationSet.subscribe(
        app.dataProvider.onData('executionContexts', this._addExecutionContexts.bind(this, app))
      );
    }
  }

  _addExecutionContexts(app, contexts) {
    // TODO: [performance] can we incrementally add new contexts only?
    this._mergeAll();
  }

  _makeKey(firstTrace) {
    const { applicationId } = firstTrace;
    return `${applicationId}_${firstTrace.traceId}`;
  }

  _addOne = (firstTrace) => {
    this._firstTracesArray.push(firstTrace);

    const key = this._makeKey(firstTrace);
    this._firstTraceIndexById.set(key, this._firstTracesArray.length - 1);
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  getAll() {
    return this._firstTracesArray;
  }

  getIndex(firstTrace) {
    const key = this._makeKey(firstTrace);
    const index = this._firstTraceIndexById.get(key);
    if (index === undefined) {
      throw new Error('invalid query - context is not a root trace', firstTrace);
    }
    return index;
  }

  getFirstTraceInOrder() {
    return this._firstTracesArray[0] || null;
  }

  getNextFirstTrace(firstTrace: Trace) {
    const order = this.getIndex(firstTrace);
    return this._firstTracesArray[order + 1] || null;
  }

  getPreviousFirstTrace(firstTrace: Trace) {
    const order = this.getIndex(firstTrace);
    return this._firstTracesArray[order - 1] || null;
  }
}


// ###########################################################################
// ApplicationSetData
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
export default class ApplicationSetData {
  constructor(applicationSet) {
    this.applicationSet = applicationSet;
    this.firstTracesInOrder = new FirstTracesInOrder(this);

    // this.applicationSet._emitter.on('_applicationsChanged0', this._handleApplicationsChanged);
    this.applicationSet.onApplicationsChanged(this._handleApplicationsChanged);
  }

  get set() {
    return this.applicationSet;
  }

  _handleApplicationsChanged = () => {
    this.firstTracesInOrder._handleApplicationsChanged();
  }

  /**
   * Return amount of applications that have executed given file.
   */
  getApplicationCountAtPath(fpath) {
    const applications = this.set.getAll();
    return applications.reduce((sum, { dataProvider }) => {
      const programId = dataProvider.queries.programIdByFilePath(fpath);
      return sum + !!programId;
    }, 0);
  }

  /**
   * @param {fileSelectedApplicationCallback} cb
   */
  mapApplicationsOfFilePath(fpath, cb) {
    const applications = this.set.getAll();
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