import { logInternalError } from 'dbux-common/src/log/logger';
import ValueRefCategory, { determineValueRefCategory } from 'dbux-common/src/core/constants/ValueRefCategory';
import serialize from 'dbux-common/src/serialization/serialize';
import Collection from './Collection';
import pools from './pools';

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

  registerValueMaybe(hasValue, value, valueHolder) {
    if (!hasValue) {
      valueHolder.valueId = 0;
      valueHolder.value = undefined;
    }
    else {
      this.registerValue(value, valueHolder);
    }
  }

  registerValue(value, valueHolder) {
    const category = determineValueRefCategory(value);
    if (category === ValueRefCategory.Primitive) {
      valueHolder.valueId = 0;
      valueHolder.value = value;
    }
    else {
      const valueId = this._addValue(category, value);
      valueHolder.valueId = valueId;
      valueHolder.value = undefined;
    }
  }

  addValue(value) {

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

  _addValue(category, value) {
    // create new ref
    const valueRef = new pools.values.allocate();
    
    // track value
    const tracked = this._trackValue(value, valueRef);

    const valueId = this._all.length;
    valueRef.valueId = valueId;
    valueRef.trackId = tracked.trackId;
    valueRef.category = category;
    valueRef.serialized = serialize(value);

    // add + send
    this._add(valueRef);

    return valueId;
  }
}

const valueCollection = new ValueCollection();

export default valueCollection;