import PromiseLink from '@dbux/common/src/types/PromiseLink';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @extends {CollectionIndex<PromiseLink>} */
export default class NestedPromiseFromIndex extends CollectionIndex {
  constructor() {
    super('promiseLinks', 'from');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {PromiseLink} promiseLink
   */
  makeKey(dp, promiseLink) {
    return promiseLink.from || false;
  }
}