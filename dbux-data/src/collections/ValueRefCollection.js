import { isObjectCategory, ValuePruneState } from '@dbux/common/src/types/constants/ValueTypeCategory';
import ValueRef from '@dbux/common/src/types/ValueRef';
import Collection from '../Collection';

/**
 * @extends {Collection<ValueRef>}
 */
export default class ValueRefCollection extends Collection {
  _visited = new Set();

  constructor(dp) {
    super('values', dp);
  }

  postAddRaw(entries) {
    // deserialize
    this.errorWrapMethod('deserializeShallow', entries);
  }

  getAllById(ids) {
    return ids.map(id => this.getById(id));
  }

  deserializeShallow(valueRefs) {
    for (let valueRef of valueRefs) {
      if (!('value' in valueRef)) {
        const {
          nodeId,
          category,
          serialized,
          pruneState
        } = valueRef;

        if (pruneState !== ValuePruneState.Omitted && isObjectCategory(category)) {
          // map: [childRefId, childValue] => [(creation)nodeId, childRefId, childValue]
          valueRef.value = Object.fromEntries(Object.entries(serialized).map(([key, childEntry]) => [key, [nodeId, ...childEntry]]));
        }
        else {
          valueRef.value = serialized;
        }
        delete valueRef.serialized;
      }
    }
  }
}