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

  /** 
   * @override
   * @param {RuntimeDataProvider} dp
   * @param {PromiseLink} entry
   */
  addEntryToKey(key, entry) {
    if (Array.isArray(key)) {
      // add once per key
      key.forEach(k => super.addEntryToKey(k, entry));
    }
    else {
      super.addEntryToKey(key, entry);
    }
  }
}