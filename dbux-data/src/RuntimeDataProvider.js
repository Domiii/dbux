import DataProviderBase from './DataProviderBase';
import DataProviderUtil from './dataProviderUtil';
import StaticProgramContextCollection from './collections/StaticProgramContextCollection';
import StaticContextCollection from './collections/StaticContextCollection';
import StaticTraceCollection from './collections/StaticTraceCollection';
import ExecutionContextCollection from './collections/ExecutionContextCollection';
import TraceCollection from './collections/TraceCollection';
import DataNodeCollection from './collections/DataNodeCollection';
import ValueRefCollection from './collections/ValueRefCollection';
import PromiseLinkCollection from './collections/PromiseLinkCollection';
import AsyncNodeCollection from './collections/AsyncNodeCollection';
import AsyncEventCollection from './collections/AsyncEventCollection';
import AsyncEventUpdateCollection from './collections/AsyncEventUpdateCollection';

/** @typedef { import("./applications/Application").default } Application */
/** @typedef { import("./RuntimeDataStatsReporter").default } RuntimeDataStatsReporter */
/** @typedef {import('./callGraph/CallGraph').default} CallGraph */
/** @typedef {import('./pdg/PDGSet').default} PDGSet */

// ###########################################################################
// RDP
// ###########################################################################

export default class RuntimeDataProvider extends DataProviderBase {
  /**
   * @type {typeof DataProviderUtil}
   */
  util;

  /**
   * @type {CallGraph}
   */
  callGraph;

  /**
   * @type {PDGSet}
   */
  programDependencyGraphs;

  /**
   * @type {RuntimeDataStatsReporter}
   */
  reporter;

  /**
   * @type {Application}
   */
  application;


  /**
   * @param {Application} application
   */
  constructor(application) {
    super('RuntimeDataProvider');

    this.application = application;

    // NOTE: we have to hardcode these so we get Intellisense
    // NOTE2: order matters!!!
    this.collections = {
      staticProgramContexts: new StaticProgramContextCollection(this),
      staticContexts: new StaticContextCollection(this),
      staticTraces: new StaticTraceCollection(this),

      executionContexts: new ExecutionContextCollection(this),
      traces: new TraceCollection(this),
      dataNodes: new DataNodeCollection(this),
      values: new ValueRefCollection(this),
      promiseLinks: new PromiseLinkCollection(this),
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

  get pdgs() {
    return this.programDependencyGraphs;
  }

  addData(newData, isRaw = true) {
    this.reporter.preData(newData);

    // const minAsyncNodeId = this.collections.asyncNodes.getLast()?.rootContextId || 0;

    // actually add data
    const result = super.addData(newData, isRaw);

    if (isRaw) {
      // NOTE: every time new contexts are added, make sure that all root contexts are accounted for in AsyncGraph
      this.collections.asyncNodes.addUnassignedNodes(/* minAsyncNodeId */);
    }

    this.reporter.reportNewData(newData);

    return result;
  }
}
