import { logInternalError } from 'dbux-common/src/log/logger';
import ValueTypeCategory, { determineValueTypeCategory, ValuePruneState } from 'dbux-common/src/core/constants/ValueTypeCategory';
// import serialize from 'dbux-common/src/serialization/serialize';
import Collection from './Collection';
import pools from './pools';

const SerializationConfig = {
  maxDepth: 3,
  maxObjectSize: 20,   // applies to arrays and object
  maxStringLength: 100
};


class TrackedValue {
  static _lastId = 0;

  value;
  refs = [];

  constructor(value) {
    this.value = value;
    this.trackId = ++TrackedValue._lastId;
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
    const category = determineValueTypeCategory(value);
    if (category === ValueTypeCategory.Primitive) {
      valueHolder.valueId = 0;
      valueHolder.value = value;
    }
    else {
      const valueRef = this._serialize(value, 1, category);
      valueHolder.valueId = valueRef.valueId;
      valueHolder.value = undefined;
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

  _addValue(value, category, typeName, serialized, pruneState = false) {
    // create new ref
    const valueRef = new pools.values.allocate();

    // track value
    const tracked = this._trackValue(value, valueRef);

    const valueId = this._all.length;
    valueRef.valueId = valueId;
    valueRef.trackId = tracked.trackId;
    valueRef.category = category;
    valueRef.typeName = typeName;
    valueRef.serialized = serialized;
    valueRef.pruneState = pruneState;

    // register + send out
    this._add(valueRef);

    return valueRef;
  }


  // ###########################################################################
  // serialization
  // ###########################################################################
  _errorCount = 0;

  _readProperty(obj, key) {
    try {
      return obj[key];
    }
    catch (err) {
      ++this._errorCount;
      return `(ERROR: accessing ${key} caused exception)`;
    }
  }

  _serialize(value, nDepth = 1, category = null) {
    if (nDepth > SerializationConfig.maxDepth) {
      return this._addValue(null, null, null, '...', ValuePruneState.Omitted);
    }

    category = category || determineValueTypeCategory(value);

    // let serialized = serialize(category, value, serializationConfig);
    let serialized;
    let pruneState = ValuePruneState.Normal;
    let typeName = '';

    switch (category) {
      case ValueTypeCategory.String:
        if (value.length > SerializationConfig.maxStringLength) {
          serialized = serialized.substring(0, SerializationConfig.maxStringLength);
          pruneState = ValuePruneState.Shortened;
        }
        break;
      case ValueTypeCategory.Function:
        serialized = 'ƒ';
        break;
      case ValueTypeCategory.Array: {
        let n = value.length;
        if (n > SerializationConfig.maxObjectSize) {
          pruneState = ValuePruneState.Shortened;
          n = SerializationConfig.maxObjectSize;
        }

        // build array
        serialized = [];
        for (let i = 0; i < n; ++i) {
          const childRef = this._serialize(value, nDepth + 1);
          serialized.push(childRef.valueId);
        }
        break;
      }
      case ValueTypeCategory.Object: {
        const props = Object.keys(value);
        typeName = value.constructor?.name || '';

        // prune?
        let n = props.length;
        if (n > SerializationConfig.maxObjectSize) {
          pruneState = ValuePruneState.Shortened;
          n = SerializationConfig.maxObjectSize;
        }

        // build object
        serialized = [];
        for (let i = 0; i < n; ++i) {
          const prop = props[i];
          const propValue = this._readProperty(value, prop);
          const childRef = this._serialize(propValue, nDepth + 1);
          serialized.push([prop, childRef.valueId]);
        }
        break;
      }
      default:
        serialized = value + '';
        break;
    }

    // add/register/track value
    return this._addValue(value, category, typeName, serialized, pruneState);
  }
}

const valueCollection = new ValueCollection();

export default valueCollection;