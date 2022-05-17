import ValueTypeCategory, { isObjectCategory, ValuePruneState } from '@dbux/common/src/types/constants/ValueTypeCategory';
import ValueRef from '@dbux/common/src/types/ValueRef';
import Collection from '../Collection';
import RefSnapshot from '../../../dbux-common/src/types/RefSnapshot';

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

  /**
   * @param {ValueRef[]} valueRefs 
   */
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

        // TODO: what about `ValuePruneState.{ReadError,ValueDisabled}`?
        //    → isPruneStateOk(pruneState)
        if (pruneState !== ValuePruneState.Omitted && isObjectCategory(category) && serialized) {
          // TODO: also `nodeId` is not (but should be?) that of `childRef`
          // TODO: should we try to look up `nodeId` from `childRefId`, if it exists?
          //      → also, sometimes, we don't have a unique `nodeId` for refs whose explicit creation we have not recorded
          //        (e.g. `a` in JSON.parse('{ "a": { "b": 3 } }'))
          if (Array.isArray(serialized)) {
            // array
            valueRef.childSnapshotsByKey = serialized.map(([childRefId, childValue]) =>
              new RefSnapshot(nodeId, childRefId, childValue)
            );
          }
          else {
            // plain object
            valueRef.childSnapshotsByKey = Object.fromEntries(
              Object.entries(serialized)
                .map(([key, [childRefId, childValue]]) =>
                  [key, new RefSnapshot(nodeId, childRefId, childValue)]
                )
            );
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