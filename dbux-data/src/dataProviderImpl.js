import DataProvider from './DataProvider';

import CallGraph from './callGraph/CallGraph';

import TracesByFileIndex from './impl/indexes/TracesByFileIndex';
import ContextChildrenIndex from './impl/indexes/ContextChildrenIndex';
import RootContextsIndex from './impl/indexes/RootContextsIndex';
import FirstTracesIndex from './impl/indexes/FirstTracesIndex';
import FirstContextsInRunsIndex from './impl/indexes/FirstContextsInRunsIndex';
import TracesByContextIndex from './impl/indexes/TracesByContextIndex';
import TracesByParentContextIndex from './impl/indexes/TracesByParentContextIndex';
import TracesByStaticTraceIndex from './impl/indexes/TracesByStaticTraceIndex';
import TracesByRunIndex from './impl/indexes/TracesByRunIndex';
import TracesByStaticContextIndex from './impl/indexes/TracesByStaticContextIndex';
import TracesByTrackIdIndex from './impl/indexes/TracesByTrackIdIndex';
import TracesByParentTraceIndex from './impl/indexes/TracesByParentTraceIndex';
import TracesByParentStaticContextIndex from './impl/indexes/TracesByParentStaticContextIndex';
import ErrorTracesIndex from './impl/indexes/ErrorTracesIndex';
import ErrorTracesByRunIndex from './impl/indexes/ErrorTracesByRunIndex';

import VisitedStaticTracesByFileIndex from './impl/indexes/VisitedStaticTracesByFileIndex';
import ParentTracesInRealContextIndex from './impl/indexes/ParentTracesInRealContextIndex';

import ProgramIdByFilePathQuery from './impl/queries/ProgramIdByFilePathQuery';
import ProgramFilePathByTraceIdQuery from './impl/queries/ProgramFilePathByTraceIdQuery';
import dataProviderUtil from './dataProviderUtil';
import StaticContextsByFileIndex from './impl/indexes/StaticContextsByFileIndex';
import StaticContextsByParentIndex from './impl/indexes/StaticContextsByParentIndex';
import CallArgsByCallIndex from './impl/indexes/CallArgsByCallIndex';
import ContextsByStaticContextIndex from './impl/indexes/ContextsByStaticContextIndex';
import TracesByRealContextIndex from './impl/indexes/TracesByRealContextIndex';
import StaticTracesByContextIndex from './impl/indexes/StaticTracesByContextIndex';
import ContextsByRunIndex from './impl/indexes/ContextsByRunIndex';


export function newDataProvider(application) {
  const dataProvider = new DataProvider(application);
  
  // util
  const utilNames = Object.keys(dataProviderUtil);
  dataProvider.util = Object.fromEntries(
    utilNames.map(name => [name, dataProviderUtil[name].bind(null, dataProvider)])
  );

  // call graph
  dataProvider.callGraph = new CallGraph(dataProvider);
  
  // indexes
  dataProvider.addIndex(new StaticContextsByFileIndex());
  dataProvider.addIndex(new StaticContextsByParentIndex());
  dataProvider.addIndex(new StaticTracesByContextIndex());

  dataProvider.addIndex(new ContextsByStaticContextIndex());
  dataProvider.addIndex(new ContextsByRunIndex());
  dataProvider.addIndex(new ContextChildrenIndex());
  dataProvider.addIndex(new RootContextsIndex());
  dataProvider.addIndex(new FirstContextsInRunsIndex());
  
  dataProvider.addIndex(new FirstTracesIndex());
  dataProvider.addIndex(new TracesByFileIndex());
  dataProvider.addIndex(new TracesByContextIndex());
  dataProvider.addIndex(new TracesByParentContextIndex());
  dataProvider.addIndex(new TracesByParentTraceIndex());
  dataProvider.addIndex(new TracesByStaticTraceIndex());
  dataProvider.addIndex(new TracesByStaticContextIndex());
  dataProvider.addIndex(new TracesByParentStaticContextIndex());
  dataProvider.addIndex(new TracesByRunIndex());
  dataProvider.addIndex(new TracesByTrackIdIndex());
  dataProvider.addIndex(new ErrorTracesIndex());
  dataProvider.addIndex(new ErrorTracesByRunIndex());
  dataProvider.addIndex(new CallArgsByCallIndex());

  dataProvider.addIndex(new TracesByRealContextIndex());

  // complex indexes (that have dependencies)
  // NOTE: we are currently solving index dependencies by simply adding depdendents after dependees
  dataProvider.addIndex(new VisitedStaticTracesByFileIndex());
  dataProvider.addIndex(new ParentTracesInRealContextIndex());


  // queries
  dataProvider.addQuery(new ProgramIdByFilePathQuery());
  dataProvider.addQuery(new ProgramFilePathByTraceIdQuery());

  return dataProvider;
}
