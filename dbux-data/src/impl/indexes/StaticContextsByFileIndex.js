import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import StaticContext from '@dbux/common/src/core/data/StaticContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/**
 * @extends {CollectionIndex<StaticContext>}
 */
export default class StaticContextsByFileIndex extends CollectionIndex {
  constructor() {
    super('staticContexts', 'byFile');
  }

  /**
   * @param {RuntimeDataProvider} dp 
   * @param {StaticContext} staticContext
   */
  makeKey(dp, staticContext) {
    return staticContext.programId;
  }
}