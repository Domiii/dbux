import DataProviderBase from './DataProviderBase';
import DataProviderUtil from './dataProviderUtil';
import StaticProgramContextCollection from './collections/StaticProgramContextCollection';
import StaticContextCollection from './collections/StaticContextCollection';
import StaticTraceCollection from './collections/StaticTraceCollection';
import ExecutionContextCollection from './collections/ExecutionContextCollection';
import TraceCollection from './collections/TraceCollection';
import DataNodeCollection from './collections/DataNodeCollection';
import ValueRefCollection from './collections/ValueRefCollection';
import AsyncNodeCollection from './collections/AsyncNodeCollection';
import AsyncEventCollection from './collections/AsyncEventCollection';
import AsyncEventUpdateCollection from './collections/AsyncEventUpdateCollection';

/** @typedef { import("./RuntimeDataStatsReporter").default } RuntimeDataStatsReporter */

// ###########################################################################
// RDP
// ###########################################################################

export default class RuntimeDataProvider extends DataProviderBase {
  /**
   * @type {typeof DataProviderUtil}
   */
  util;

  callGraph;

  /**
   * @type {RuntimeDataStatsReporter}
   */
  reporter;

  constructor(application) {
    super('RuntimeDataProvider');

    this.application = application;

    // NOTE: we have to hardcode these so we get Intellisense
    this.collections = {
      staticProgramContexts: new StaticProgramContextCollection(this),
      staticContexts: new StaticContextCollection(this),
      staticTraces: new StaticTraceCollection(this),

      executionContexts: new ExecutionContextCollection(this),
      traces: new TraceCollection(this),
      dataNodes: new DataNodeCollection(this),
      values: new ValueRefCollection(this),
      asyncEventUpdates: new AsyncEventUpdateCollection(this),
      asyncNodes: new AsyncNodeCollection(this),
      asyncEvents: new AsyncEventCollection(this)
    };

    // const collectionClasses = [
    //   StaticProgramContextCollection,
    //   StaticContextCollection,
    //   StaticTraceCollection,

    //   ExecutionContextCollection,
    //   TraceCollection,
    //   ValueCollection
    // ];
    // this.collections = Object.fromEntries(collectionClasses.map(Col => {
    //   const col = new Col(this);
    //   return [col.name, col];
    // }));
  }

  addData(newData, isRaw = true) {
    this.reporter.preData(newData);

    // actually add data
    const result = super.addData(newData, isRaw);

    this.reporter.reportNewData(newData);

    return result;
  }
}