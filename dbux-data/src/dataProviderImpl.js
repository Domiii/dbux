import DataProvider from './DataProvider';
import TracesByFileIndex from './impl/indexes/TracesByFileIndex';
import ProgramIdByFilePathQuery from './impl/queries/ProgramIdByFilePathQuery';

/**
 * This file handles the default settings, implementations and setup of `DataProvider`.
 * 
 * @file
 */

let defaultDataProvider: DataProvider;

export function newDataProvider() {
  const dataProvider = new DataProvider();
  
  // indexes
  dataProvider.indexes._addIndex(new TracesByFileIndex());

  // queries
  dataProvider.queries._addQuery(new ProgramIdByFilePathQuery());
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