import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import StaticContext from '@dbux/common/src/core/data/StaticContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/**
 * @extends {CollectionIndex<StaticContext>}
 */
export default class StaticContextsByFileIndex extends CollectionIndex {
  constructor() {
    super('staticContexts', 'byFile');
  }

  /**
   * @param {DataProvider} dp 
   * @param {StaticContext} staticContext
   */
  makeKey(dp, staticContext) {
    return staticContext.programId;
  }
}