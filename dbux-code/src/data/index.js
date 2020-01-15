import DataProvider from 'dbux-data/src/DataProvider';


export function newDataProvider(dataSource) {
  const dataProvider = new DataProvider();
  dataSource.on('data', (source, data) => {
    dataProvider.addData(data);
  });
  return dataProvider;
}