import DataProvider from './DataProvider';
import TracesByFileIndex from './impl/indexes/TracesByFileIndex';
import ContextChildrenIndex from './impl/indexes/ContextChildrenIndex';
import TracesByContextIndex from './impl/indexes/TracesByContextIndex';
import ProgramIdByFilePathQuery from './impl/queries/ProgramIdByFilePathQuery';
import ProgramFilePathByTraceId from './impl/queries/ProgramFilePathByTraceIdQuery';

/**
 * This file handles the default settings, implementations and setup of `DataProvider`.
 * 
 * @file
 */

let defaultDataProvider: DataProvider;

export function newDataProvider() {
  const dataProvider = new DataProvider();
  
  // indexes
  dataProvider.addIndex(new ContextChildrenIndex());

  dataProvider.addIndex(new TracesByFileIndex());
  dataProvider.addIndex(new TracesByContextIndex());

  // queries
  dataProvider.addQuery(new ProgramIdByFilePathQuery());
  dataProvider.addQuery(new ProgramFilePathByTraceId());

  return dataProvider;
}

/**
 * Returns the current default DataProvider.
 */
export function getDefaultDataProvider(): DataProvider {
  if (!defaultDataProvider) {
    defaultDataProvider = newDataProvider();
  }

  return defaultDataProvider;
}