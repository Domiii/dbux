import UniqueRefId from '@dbux/common/src/types/constants/UniqueRefId';
import valueCollection from '../data/valueCollection';

export function addPurpose(trace, purpose) {
  // [edit-after-send]
  trace.purposes = trace.purposes || [];
  if (purpose.constructor === Number) {
    purpose = {
      type: purpose
    };
  }
  trace.purposes.push(purpose);
}

function makeUniqueRefKey(ref) {
  return `ref${ref.refId}-${UniqueRefId}`;
}

/**
 * In order to deal with `Map` and `Set`, we need to generate a uniquely identifiable key for non-primitives.
 */
export function makeKey(val) {
  const ref = valueCollection.getRefByValue(val);
  if (ref) {
    return makeUniqueRefKey(ref);
  }
  return val;
}
