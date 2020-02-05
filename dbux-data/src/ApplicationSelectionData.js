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

    const applicationSelection = this.applicationSelectionData._applicationSelection;
    const selectedApplications = applicationSelection.getSelectedApplications();
    this._rootContextsArray = [];

    for (const app of selectedApplications) {
      applicationSelection.subscibe(app.dataProvider.onData('executionContexts', this._addExecutionContexts.bind(this, app)));
    }

    // merge all initially
    this._mergeAll();
  }

  _mergeAll() {
    this._rootContextsArray = [];

    // TODO: merge by date~~~
    // for (const app of applications) {
    //   const rootContexts = app.dataProvider.util.getRootContexts();
    //   rootContexts.forEach(this._addOne)
    // }
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

  getNextRootContext(rootContext) {
    const order = this.getIndex(rootContext);
    return this._rootContextsArray[order + 1] || null;
  }

  getPreviousRootContext(rootContext) {
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
    this._applicationSelection = applicationSelection;
    this.rootContextsInOrder = new RootContextsInOrder(this);

    this._applicationSelection._emitter.on('_selectionChanged0', this._handleSelectionChanged);
  }

  get selection() {
    return this._applicationSelection;
  }

  _handleSelectionChanged(selectedApplications) {
    this.rootContextsInOrder = new RootContextsInOrder(this);
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

    for (const application of applications) {
      const { dataProvider } = application;

      const programId = dataProvider.queries.programIdByFilePath(fpath);
      if (!programId) {
        // program did not execute for this application
        continue;
      }

      cb(application, programId);
    }
  }
}