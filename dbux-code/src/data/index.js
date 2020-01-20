import DataProvider from 'dbux-data/src/DataProvider';
import { getDefaultDataProvider } from 'dbux-data/src/dataProviderImpl';

export function newDataProvider(dataSource): DataProvider {
  const dataProvider = getDefaultDataProvider();
  dataSource.on('data', (source, data) => {
    // console.log('[DATA rcv]', data);
    dataProvider.addData(data);
  });

  return dataProvider;
}