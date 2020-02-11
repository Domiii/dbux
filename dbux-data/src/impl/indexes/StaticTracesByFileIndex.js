import StaticTrace from 'dbux-common/src/core/data/StaticTrace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class StaticTracesByFileIndex extends CollectionIndex<StaticTrace> {
  constructor() {
    super('staticTraces', 'byFile');
  }
  
  makeKey(dp: DataProvider, staticTrace: StaticTrace) {
    return dp.util.getStaticTraceProgramId(staticTrace.staticTraceId);
  }
}