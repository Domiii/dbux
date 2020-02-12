
import StaticTrace from 'dbux-common/src/core/data/StaticTrace';
import StaticContext from 'dbux-common/src/core/data/StaticContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class StaticContextsByParentIndex extends CollectionIndex<StaticContext> {
  constructor() {
    super('staticContexts', 'byParent');
  }

  makeKey(dp: DataProvider, staticContext: StaticTrace) {
    return staticContext.parentId || 0;
  }
}
