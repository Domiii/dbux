import DataProvider from './DataProvider';
import TracesByFileIndex from './impl/indexes/TracesByFileIndex';
import ContextChildrenIndex from './impl/indexes/ContextChildrenIndex';
import TracesByContextIndex from './impl/indexes/TracesByContextIndex';
import ProgramIdByFilePathQuery from './impl/queries/ProgramIdByFilePathQuery';
import ProgramFilePathByTraceId from './impl/queries/ProgramFilePathByTraceIdQuery';
import dataProviderUtil from './dataProviderUtil';

/**
 * This file handles the default settings, implementations and setup of `DataProvider`.
 * 
 * @file
 */

let defaultDataProvider: DataProvider;

export function newDataProvider(entryPointPath) {
  const dataProvider = new DataProvider(entryPointPath);
  
  // indexes
  dataProvider.addIndex(new ContextChildrenIndex());

  dataProvider.addIndex(new TracesByFileIndex());
  dataProvider.addIndex(new TracesByContextIndex());

  // queries
  dataProvider.addQuery(new ProgramIdByFilePathQuery());
  dataProvider.addQuery(new ProgramFilePathByTraceId());
  
  // hackfix: add utilities
  const utilNames = Object.keys(dataProviderUtil);
  dataProvider.util = Object.fromEntries(
    utilNames.map(name => [name, dataProviderUtil[name].bind(null, dataProvider)])
  );

  return dataProvider;
}
