import ValueRef from '@dbux/common/src/types/ValueRef';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<ValueRef>} */
export default class ValueRefByNodeIndex extends CollectionIndex {
  constructor() {
    super('values', 'byNodeId');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {ValueRef} valueRef
   */
  makeKey(dp, valueRef) {
    return valueRef.nodeId || 0;
  }
}