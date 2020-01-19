import DataProvider, { getDefaultDataProvider } from 'dbux-data/src/DataProvider';
import TracesByFileIndex from 'dbux-data/src/indexes/TracesByFileIndex';


function addDefaultIndexes(dp: DataProvider) {
  dp.collections.traces.addIndex(new TracesByFileIndex());
}

export function newDataProvider(dataSource) : DataProvider {
  const dataProvider = getDefaultDataProvider();
  dataSource.on('data', (source, data) => {
    // console.log('[DATA rcv]', data);
    dataProvider.addData(data);
  });

  addDefaultIndexes(dataProvider);

  return dataProvider;
}