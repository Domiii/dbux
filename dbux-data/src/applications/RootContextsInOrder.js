import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Trace from '@dbux/common/src/types/Trace';

// ###########################################################################
//  RootContextsInOrder
// ###########################################################################

export default class RootContextsInOrder {
  /**
   * @type {Array<Trace>}
   */
  _firstTracesArray;
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
    const allFirstTraces = applications.map((app) => app.dataProvider.util.getFirstTracesInRuns() || EmptyArray);

    // sort traces by trace.createdAt
    const indexPointers = Array(applications.length).fill(0);
    const tracesCount = allFirstTraces.reduce((sum, arr) => sum + arr.length, 0);

    for (let i = 0; i < tracesCount; i++) {
      let earliestTrace = null;
      let earliestApplicationIndex = null;
      for (let j = 0; j < applications.length; j++) {
        const trace = allFirstTraces[j][indexPointers[j]];
        if (!trace) continue;
        if (!earliestTrace || trace.createdAt < earliestTrace.createdAt) {
          earliestTrace = trace;
          earliestApplicationIndex = j;
        }
      }
      indexPointers[earliestApplicationIndex] += 1;
      this._addOne(earliestTrace);
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

  _addExecutionContexts(/* app, contexts */) {
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
      throw new Error('invalid query - given trace is not a root trace', firstTrace);
    }
    return index;
  }

  getFirstTraceInOrder() {
    return this._firstTracesArray[0] || null;
  }

  /**
   * @param {Trace} firstTrace 
   */
  getNextFirstTrace(firstTrace) {
    const order = this.getIndex(firstTrace);
    return this._firstTracesArray[order + 1] || null;
  }

  /**
   * @param {Trace} firstTrace 
   */
  getPreviousFirstTrace(firstTrace) {
    const order = this.getIndex(firstTrace);
    return this._firstTracesArray[order - 1] || null;
  }
}
