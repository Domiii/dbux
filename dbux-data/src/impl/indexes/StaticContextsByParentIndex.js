
import StaticTrace from '@dbux/common/src/types/StaticTrace';
import StaticContext from '@dbux/common/src/types/StaticContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<StaticContext>} */
export default class StaticContextsByParentIndex extends CollectionIndex {
  constructor() {
    super('staticContexts', 'byParent');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {StaticTrace} staticContext
   */
  makeKey(dp, staticContext) {
    return staticContext.parentId || 0;
  }
}
