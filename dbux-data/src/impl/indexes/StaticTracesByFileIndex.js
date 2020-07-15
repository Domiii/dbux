import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/** @extends {CollectionIndex<StaticTrace>} */
export default class StaticTracesByFileIndex extends CollectionIndex {
  constructor() {
    super('staticTraces', 'byFile');
  }
  
  /** 
   * @param {DataProvider} dp
   * @param {StaticTrace} staticTrace
   */
  makeKey(dp, staticTrace) {
    return dp.util.getStaticTraceProgramId(staticTrace.staticTraceId);
  }
}