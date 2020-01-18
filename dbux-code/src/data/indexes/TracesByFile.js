import { DataProvider } from 'dbux-data/src/DataProvider';

function keygen(dp: DataProvider, entry) : string {
  // TODO
}

export function addIndex(dp : DataProvider) {
  dp.collections.traces.addIndex('byFile', keygen);
}