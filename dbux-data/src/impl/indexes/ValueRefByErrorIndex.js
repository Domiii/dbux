import ValueRef from '@dbux/common/src/types/ValueRef';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<ValueRef>} */
export default class ValueRefByErrorIndex extends CollectionIndex {
  constructor() {
    super('values', 'error');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {ValueRef} valueRef
   */
  makeKey(dp, valueRef) {
    if (valueRef.isError) {
      return 1;
    }
    return false;
  }
}