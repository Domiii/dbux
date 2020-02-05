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
    // is this for initialize?
    this._rootContextsArray = [];
    const applications = this.applicationSelectionData._applicationSelection.getSelectedApplications();
    let allRootContexts = applications.map((app) => app.dataProvider.util.getAllRootContexts());
    let indexPointers = Array(applications.length).fill(0);
    let contextCount = allRootContexts.reduce((sum, arr) => sum + arr.length, 0);

    for (let i = 0; i < contextCount; i++) {
      let earliestContext = allRootContexts[0][indexPointers[0]];
      const context = allRootContexts[j][indexPointers[j]];
      for (let j = 1; j < applications.length; j++) {  
        if (context.createdAt < earliestContext) earliestContext = context;
      }
      this._addOne(context)
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
 * Encapsulates all data that is related to the set of selected applications;
 * specifically, any data that changes when selected applications change.
 */
export default class ApplicationSelectionData {
  constructor(applicationSelection) {
    this._applicationSelection = applicationSelection;
    this.rootContextsInOrder = new RootContextsInOrder(this);

    this._applicationSelection._emitter.on('_selectionChanged0', this._handleSelectionChanged);
  }

  _handleSelectionChanged(selectedApplications) {
    this.rootContextsInOrder = new RootContextsInOrder(this);
  }
}