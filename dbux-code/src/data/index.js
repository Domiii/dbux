import { DataProvider, getDefaultDataProvider } from 'dbux-data/src/DataProvider';


export function newDataProvider(dataSource) {
  const dataProvider = getDefaultDataProvider();
  dataSource.on('data', (source, data) => {
    // console.log('[DATA rcv]', data);
    dataProvider.addData(data);
  });
  return dataProvider;
}