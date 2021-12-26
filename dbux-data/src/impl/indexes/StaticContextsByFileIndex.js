import StaticContext from '@dbux/common/src/types/StaticContext';
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