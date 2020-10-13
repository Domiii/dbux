import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<StaticTrace>} */
export default class StaticTracesByFileIndex extends CollectionIndex {
  constructor() {
    super('staticTraces', 'byFile');
  }
  
  /** 
   * @param {RuntimeDataProvider} dp
   * @param {StaticTrace} staticTrace
   */
  makeKey(dp, staticTrace) {
    return dp.util.getStaticTraceProgramId(staticTrace.staticTraceId);
  }
}