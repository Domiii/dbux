import { logInternalError } from 'dbux-common/src/log/logger';
import Collection from './Collection';
import ValueRefType, { determineValueRefType } from 'dbux-common/src/core/constants/ValueRefType';
import pools from './pools';
import serialize from 'dbux-common/src/serialization/serialize';

class TrackedValue {
  static _lastId = 0;

  value;
  refs = [];

  constructor(value) {
    this.value = value;
    this.trackedId = ++TrackedValue._lastId;
  }

  addRef(ref) {
    this.refs.push(ref);
  }
}

/**
 * Keeps track of `StaticTrace` objects that contain static code information
 */
class ValueCollection extends Collection {
  trackedValues = new Map();

  constructor() {
    super('values');
  }

  processValue(hasValue, value, result) {
    if (!hasValue) {
      result.valueId = 0;
      result.value = undefined;
    }
    else {
      const type = determineValueRefType(value);
      if (type === ValueRefType.Primitive) {
        result.valueId = 0;
        result.value = value;
      }
      else {
        const valueId = this._addValue(type, value);
        result.valueId = valueId;
        result.value = undefined;
      }
    }
  }

  /**
   * Keep track of all refs of a value.
   */
  _trackValue(value, valueRef) {
    let tracked = this.trackedValues.get(value);
    if (!tracked) {
      this.trackedValues.set(value, tracked = new TrackedValue(value));
    }
    tracked.addRef(valueRef);

    return tracked;
  }

  _addValue(type, value) {
    // create new ref
    const valueRef = new pools.values.allocate();
    
    // track value
    const tracked = this._trackValue(value, valueRef);

    const valueId = this._all.length;
    valueRef.valueId = valueId;
    valueRef.trackId = tracked.trackId;
    valueRef.type = type;
    valueRef.serialized = serialize(value);

    // add + send
    this._add(valueRef);

    return valueId;
  }
}

const valueCollection = new ValueCollection();

export default valueCollection;