
import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import StaticContext from '@dbux/common/src/core/data/StaticContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/** @extends {CollectionIndex<StaticContext>} */
export default class StaticContextsByParentIndex extends CollectionIndex {
  constructor() {
    super('staticContexts', 'byParent');
  }

  /** 
   * @param {DataProvider} dp
   * @param {StaticTrace} staticContext
   */
  makeKey(dp, staticContext) {
    return staticContext.parentId || 0;
  }
}
