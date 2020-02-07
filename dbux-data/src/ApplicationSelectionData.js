import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import TracePlayback from './playback/TracePlayback';

// ###########################################################################
// RootContextsInOrder
// ###########################################################################

class RootContextsInOrder {
  _rootContextsArray;
  _rootContextIndexById = new Map();

  /**
   * @param {ApplicationSelectionData} applicationSelectionData 
   */
  constructor(applicationSelectionData) {
    this.applicationSelectionData = applicationSelectionData;
    this._rootContextsArray = [];
  }

  _mergeAll() {
    this._rootContextsArray = [];
    const applications = this.applicationSelectionData.selection.getSelectedApplications();
    let allRootContexts = applications.map((app) => app.dataProvider.util.getAllRootContexts() || EmptyArray);
    let indexPointers = Array(applications.length).fill(0);
    let contextCount = allRootContexts.reduce((sum, arr) => sum + arr.length, 0);

    for (let i = 0; i < contextCount; i++) {
      let earliestContext = allRootContexts[0][indexPointers[0]];
      let earliestApplicationIndex = 0;
      for (let j = 1; j < applications.length; j++) {
        const context = allRootContexts[j][indexPointers[j]];
        if (context.createdAt < earliestContext) {
          earliestContext = context;
          earliestApplicationIndex = j;
        }
      }
      indexPointers[earliestApplicationIndex] += 1;
      this._addOne(earliestContext);
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

  _makeKey(rootContext) {
    const { applicationId } = rootContext;
    return `${applicationId}_${rootContext.contextId}`;
  }

  _addOne = (rootContext) => {
    this._rootContextsArray.push(rootContext);

    const key = this._makeKey(rootContext);
    this._rootContextIndexById.set(key, this._rootContextsArray.length - 1);
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  getAll() {
    return this._rootContextsArray;
  }

  getIndex(rootContext) {
    const key = this._makeKey(rootContext);
    const index = this._rootContextIndexById.get(key);
    if (index === undefined) {
      throw new Error('invalid query - context is not a root context', rootContext);
    }
    return index;
  }

  getFirstRootContext() {
    return this._rootContextsArray[0] || null;
  }

  getNextRootContext(rootContext: ExecutionContext) {
    const order = this.getIndex(rootContext);
    return this._rootContextsArray[order + 1] || null;
  }

  getPreviousRootContext(rootContext: ExecutionContext) {
    const order = this.getIndex(rootContext);
    return this._rootContextsArray[order - 1] || null;
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
    this.rootContextsInOrder = new RootContextsInOrder(this);
    this.tracePlayback = new TracePlayback(this);

    this.applicationSelection._emitter.on('_selectionChanged0', this._handleSelectionChanged);
  }

  get selection() {
    return this.applicationSelection;
  }

  _handleSelectionChanged = () => {
    this.rootContextsInOrder._handleSelectionChanged();
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