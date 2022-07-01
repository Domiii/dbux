import RuntimeDataProvider from './RuntimeDataProvider';
import dataProviderUtil from './dataProviderUtil';

import CallGraph from './callGraph/CallGraph';
import PDGSet from './pdg/PDGSet';

import TracesByFileIndex from './impl/indexes/TracesByFileIndex';
import FirstTracesIndex from './impl/indexes/FirstTracesIndex';
import FirstContextsInRunsIndex from './impl/indexes/FirstContextsInRunsIndex';
import FirstContextsInRunsByThreadIndex from './impl/indexes/FirstContextsInRunsByThreadIndex';
import TracesByContextIndex from './impl/indexes/TracesByContextIndex';
import TracesByStaticTraceIndex from './impl/indexes/TracesByStaticTraceIndex';
import TracesByRunIndex from './impl/indexes/TracesByRunIndex';
import TracesByStaticContextIndex from './impl/indexes/TracesByStaticContextIndex';
import TracesByRefIdIndex from './impl/indexes/TracesByRefIdIndex';
import TracesByRealStaticContextIndex from './impl/indexes/TracesByRealStaticContextIndex';
import TracesByRealContextIndex from './impl/indexes/TracesByRealContextIndex';
import TracesByCallIndex from './impl/indexes/TracesByCallIndex';
// import TracesByTypeIndex from './impl/indexes/TracesByTypeIndex';
import TracesBySpecialIdentifierTypeIndex from './impl/indexes/TracesBySpecialIdentifierTypeIndex';
import ErrorTracesIndex from './impl/indexes/ErrorTracesIndex';
import ErrorTracesByContextIndex from './impl/indexes/ErrorTracesByContextIndex';
import ErrorTracesByRootIndex from './impl/indexes/ErrorTracesByRootIndex';

import ContextChildrenIndex from './impl/indexes/ContextChildrenIndex';
import ContextsByStaticContextIndex from './impl/indexes/ContextsByStaticContextIndex';
import ContextsByRunIndex from './impl/indexes/ContextsByRunIndex';
import ContextsByCallerTraceIndex from './impl/indexes/ContextsByCallerTraceIndex';
import RootContextsIndex from './impl/indexes/RootContextsIndex';
import ExecutedStaticTracesByFileIndex from './impl/indexes/ExecutedStaticTracesByFileIndex';
import ParentTracesInRealContextIndex from './impl/indexes/ParentTracesInRealContextIndex';
import StaticContextsByFileIndex from './impl/indexes/StaticContextsByFileIndex';
import StaticContextsByParentIndex from './impl/indexes/StaticContextsByParentIndex';
import StaticTracesByContextIndex from './impl/indexes/StaticTracesByContextIndex';
import ContextsByTypeIndex from './impl/indexes/ContextsByTypeIndex';

import ProgramIdByFilePathQuery from './impl/queries/ProgramIdByFilePathQuery';
import ProgramFilePathByTraceIdQuery from './impl/queries/ProgramFilePathByTraceIdQuery';
import StatsByContextQuery from './impl/queries/StatsByContextQuery';
import DataNodesByTraceIndex from './impl/indexes/DataNodesByTraceIndex';
import DataNodesByAccessIdIndex from './impl/indexes/DataNodesByAccessIdIndex';
import DataNodesByValueIdIndex from './impl/indexes/DataNodesByValueIdIndex';
import DataNodesByRefIdIndex from './impl/indexes/DataNodesByRefIdIndex';
import DataNodesByObjectRefIdIndex from './impl/indexes/DataNodesByObjectRefIdIndex';
import DataNodesByObjectNodeIdIndex from './impl/indexes/DataNodesByObjectNodeIdIndex';
import PrimitiveDataNodesIndex from './impl/indexes/PrimitiveDataNodesIndex';
import AsyncEventsFromIndex from './impl/indexes/AsyncEventsFromIndex';
import AsyncEventsToIndex from './impl/indexes/AsyncEventsToIndex';
import AsyncEventsFromThreadIndex from './impl/indexes/AsyncEventsFromThreadIndex';
import AsyncEventsToThreadIndex from './impl/indexes/AsyncEventsToThreadIndex';
import SyncInAsyncEventsByRootIndex from './impl/indexes/SyncInAsyncEventsByRootIndex';
import SyncOutAsyncEventsByRootIndex from './impl/indexes/SyncOutAsyncEventsByRootIndex';
import AsyncNodesByRootIndex from './impl/indexes/AsyncNodesByRootIndex';
import AsyncNodesByThreadIndex from './impl/indexes/AsyncNodesByThreadIndex';
import AsyncEventUpdatesByTraceIndex from './impl/indexes/AsyncEventUpdatesByTraceIndex';
import AsyncEventUpdatesByPromiseIndex from './impl/indexes/PostAsyncEventUpdateByPromiseIndex';
import AsyncEventUpdatesByRootIndex from './impl/indexes/AsyncEventUpdatesByRootIndex';
import RuntimeDataStatsReporter from './RuntimeDataStatsReporter';
// import AsyncEventUpdatesByPreThenPromise from './impl/indexes/AsyncEventUpdatesByPreThenPromise';
import NestedPromiseFromIndex from './impl/indexes/NestedPromiseFromIndex';
import NestedPromiseToIndex from './impl/indexes/NestedPromiseToIndex';
import PreAsyncEventUpdatesByPostEventPromiseIndex from './impl/indexes/PreAsyncEventUpdatesByPostEventPromiseIndex';
import ValueRefByErrorIndex from './impl/indexes/ValueRefByErrorIndex';
import AsyncEventUpdatesByNestedPromiseIndex from './impl/indexes/AsyncEventUpdatesByNestedPromiseIndex';
import TracesByPurposeIndex from './impl/indexes/TracesByPurposeIndex';
import PackageQuery from './files/PackageQuery';
import ValueRefByNodeIndex from './impl/indexes/ValueRefByNodeIndex';

export function newDataProvider(application) {
  const dp = new RuntimeDataProvider(application);

  // util
  const utilNames = Object.keys(dataProviderUtil);
  dp.util = Object.fromEntries(
    utilNames.map(name => [name, dataProviderUtil[name].bind(null, dp)])
  );

  // reporter
  dp.reporter = new RuntimeDataStatsReporter(dp);

  // call graph
  dp.callGraph = new CallGraph(dp);

  // PDG
  dp.programDependencyGraphs = new PDGSet(dp);

  // indexes
  dp.addIndex(new StaticContextsByFileIndex());
  dp.addIndex(new StaticContextsByParentIndex());
  dp.addIndex(new StaticTracesByContextIndex());

  dp.addIndex(new ContextsByStaticContextIndex());
  dp.addIndex(new ContextsByRunIndex());
  dp.addIndex(new ContextsByTypeIndex());
  dp.addIndex(new ContextsByCallerTraceIndex());
  dp.addIndex(new ContextChildrenIndex());
  dp.addIndex(new RootContextsIndex());
  dp.addIndex(new FirstContextsInRunsIndex());
  dp.addIndex(new FirstContextsInRunsByThreadIndex());

  dp.addIndex(new FirstTracesIndex());
  dp.addIndex(new TracesByFileIndex());
  dp.addIndex(new TracesByContextIndex());
  dp.addIndex(new TracesByRealContextIndex());
  dp.addIndex(new TracesByStaticTraceIndex());
  dp.addIndex(new TracesByStaticContextIndex());
  dp.addIndex(new TracesByRealStaticContextIndex());
  dp.addIndex(new TracesByRunIndex());
  dp.addIndex(new TracesByCallIndex());
  // dp.addIndex(new TracesByTypeIndex());
  
  dp.addIndex(new ErrorTracesIndex());
  dp.addIndex(new ErrorTracesByContextIndex());
  dp.addIndex(new ErrorTracesByRootIndex());
  
  dp.addIndex(new TracesBySpecialIdentifierTypeIndex());
  
  // data + values
  dp.addIndex(new TracesByRefIdIndex());
  dp.addIndex(new DataNodesByTraceIndex());
  dp.addIndex(new DataNodesByAccessIdIndex());
  dp.addIndex(new DataNodesByValueIdIndex());
  dp.addIndex(new DataNodesByRefIdIndex());
  dp.addIndex(new DataNodesByObjectRefIdIndex());
  dp.addIndex(new DataNodesByObjectNodeIdIndex());
  dp.addIndex(new PrimitiveDataNodesIndex());
  dp.addIndex(new ValueRefByErrorIndex());
  dp.addIndex(new ValueRefByNodeIndex());
  
  // complex indexes (that have dependencies)
  // NOTE: we are currently solving index dependencies by simply adding depdendents after dependees
  dp.addIndex(new ExecutedStaticTracesByFileIndex());
  dp.addIndex(new ParentTracesInRealContextIndex());

  // many-to-many indexes
  dp.addIndex(new TracesByPurposeIndex());

  // ########################################
  // async
  // ########################################

  dp.addIndex(new AsyncEventsFromIndex());
  dp.addIndex(new AsyncEventsToIndex());
  dp.addIndex(new AsyncEventsFromThreadIndex());
  dp.addIndex(new AsyncEventsToThreadIndex());
  dp.addIndex(new SyncInAsyncEventsByRootIndex());
  dp.addIndex(new SyncOutAsyncEventsByRootIndex());
  dp.addIndex(new AsyncNodesByRootIndex());
  dp.addIndex(new AsyncNodesByThreadIndex());

  dp.addIndex(new AsyncEventUpdatesByTraceIndex());
  dp.addIndex(new AsyncEventUpdatesByRootIndex());
  dp.addIndex(new AsyncEventUpdatesByPromiseIndex());
  dp.addIndex(new AsyncEventUpdatesByNestedPromiseIndex());
  dp.addIndex(new PreAsyncEventUpdatesByPostEventPromiseIndex());
  dp.addIndex(new NestedPromiseFromIndex());
  dp.addIndex(new NestedPromiseToIndex());


  // queries
  dp.addQuery(new ProgramIdByFilePathQuery());
  dp.addQuery(new ProgramFilePathByTraceIdQuery());
  dp.addQuery(new StatsByContextQuery());
  dp.addQuery(new PackageQuery());

  return dp;
}
