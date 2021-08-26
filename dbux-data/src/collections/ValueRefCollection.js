import ValueTypeCategory, { isObjectCategory, ValuePruneState } from '@dbux/common/src/types/constants/ValueTypeCategory';
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
      if (!valueRef) {
        this.logger.warn(`invalid ValueCollection: contains empty values`);
        continue;
      }
      if (!('value' in valueRef)) {
        const {
          nodeId,
          category,
          serialized,
          pruneState
        } = valueRef;

        if (pruneState !== ValuePruneState.Omitted && isObjectCategory(category) && serialized) {
          if (ValueTypeCategory.is.Object(category)) {
            // map: [childRefId, childValue] => [(creation)nodeId, childRefId, childValue]
            valueRef.value = Object.fromEntries(
              Object.entries(serialized)
                .map(([key, childEntry]) => [key, [nodeId, ...childEntry]])
            );
          }
          else if (ValueTypeCategory.is.Array(category)) {
            const value = [];
            Object.entries(serialized)
              .forEach(([key, childEntry]) => value[key] = [nodeId, ...childEntry]);
            valueRef.value = value;
          }
          else {
            valueRef.value = serialized.name;
          }
        }
        else {
          valueRef.value = serialized;
        }
        delete valueRef.serialized;
      }
    }
  }
}