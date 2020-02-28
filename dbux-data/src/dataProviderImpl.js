import DataProvider from './DataProvider';

import CallGraph from './callGraph/CallGraph';

import TracesByFileIndex from './impl/indexes/TracesByFileIndex';
import ContextChildrenIndex from './impl/indexes/ContextChildrenIndex';
import RootContextsIndex from './impl/indexes/RootContextsIndex';
import FirstTracesIndex from './impl/indexes/FirstTracesIndex';
import FirstContextsInRunsIndex from './impl/indexes/FirstContextsInRunsIndex';
import TracesByContextIndex from './impl/indexes/TracesByContextIndex';
import TracesByStaticTraceIndex from './impl/indexes/TracesByStaticTraceIndex';

import VisitedStaticTracesByFileIndex from './impl/indexes/VisitedStaticTracesByFileIndex';

import ProgramIdByFilePathQuery from './impl/queries/ProgramIdByFilePathQuery';
import ProgramFilePathByTraceIdQuery from './impl/queries/ProgramFilePathByTraceIdQuery';
import dataProviderUtil from './dataProviderUtil';
import TracesByRunIdIndex from './impl/indexes/TracesByRunIdIndex';
import TracesByStaticContextIndex from './impl/indexes/TracesByStaticContextIndex';
import StaticContextsByFileIndex from './impl/indexes/StaticContextsByFileIndex';
import StaticContextsByParentIndex from './impl/indexes/StaticContextsByParentIndex';
import CallArgsByCallIndex from './impl/indexes/CallArgsByCallIndex';


export function newDataProvider(application) {
  const dataProvider = new DataProvider(application);

  // call graph
  dataProvider.callgraph = new CallGraph(dataProvider);
  
  // indexes
  dataProvider.addIndex(new StaticContextsByFileIndex());
  dataProvider.addIndex(new StaticContextsByParentIndex());

  dataProvider.addIndex(new ContextChildrenIndex());
  dataProvider.addIndex(new RootContextsIndex());
  dataProvider.addIndex(new FirstTracesIndex());
  dataProvider.addIndex(new FirstContextsInRunsIndex());

  dataProvider.addIndex(new TracesByFileIndex());
  dataProvider.addIndex(new TracesByContextIndex());
  dataProvider.addIndex(new TracesByStaticTraceIndex());
  dataProvider.addIndex(new TracesByStaticContextIndex());
  dataProvider.addIndex(new TracesByRunIdIndex());
  dataProvider.addIndex(new CallArgsByCallIndex());


  // complex indexes
  // NOTE: we are currently solving index dependencies by simply adding depdendents after dependees
  dataProvider.addIndex(new VisitedStaticTracesByFileIndex());


  // queries
  dataProvider.addQuery(new ProgramIdByFilePathQuery());
  dataProvider.addQuery(new ProgramFilePathByTraceIdQuery());
  

  // hackfix: add utilities
  const utilNames = Object.keys(dataProviderUtil);
  dataProvider.util = Object.fromEntries(
    utilNames.map(name => [name, dataProviderUtil[name].bind(null, dataProvider)])
  );

  return dataProvider;
}
