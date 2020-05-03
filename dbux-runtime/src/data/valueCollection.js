import ValueTypeCategory, { determineValueTypeCategory, ValuePruneState, isObjectCategory } from 'dbux-common/src/core/constants/ValueTypeCategory';
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
      const valueRef = this._serialize(value, 1, null, category);
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

  _addOmitted() {
    return this._addValue(null, null, null, '(...)', ValuePruneState.Omitted);
  }

  _addValue(value, category, typeName, serialized, pruneState = false) {
    // create new ref
    const valueRef = new pools.values.allocate();

    // track value
    if (isObjectCategory(category)) {
      const tracked = this._trackValue(value, valueRef);
      valueRef.trackId = tracked.trackId;
    }

    // store all other props
    const valueId = this._all.length;
    valueRef.valueId = valueId;
    valueRef.category = category;
    valueRef.typeName = typeName;
    valueRef.serialized = serialized;
    valueRef.pruneState = pruneState;

    // register + send out
    this._add(valueRef);

    return valueRef;
  }


  // ###########################################################################
  // add a bit of bubblewrap when accessing object properties 
  // ###########################################################################

  _readErrorCount = 0;
  _readErrorsByType = new Map();
  _getKeysErrorsByType = new Map();

  _canReadProperties(obj) {
    // TODO: `Object.getPrototypeOf` can trigger a proxy trap; need to check on that as well.

    // check if objects of this type have already been floodgated
    return !this._readErrorsByType.has(Object.getPrototypeOf(obj));
  }


  /**
   * Read a property of an object to copy + track it.
   * WARNING: This might invoke a getter function, thereby tempering with semantics (something that we genreally never want to do).
   */
  _readProperty(obj, key) {
    try {
      this._startAccess(obj);
      return obj[key];
    }
    catch (err) {
      this._onAccessError(obj, this._readErrorsByType);
      return `(ERROR: accessing ${key} caused exception)`;
    }
    finally {
      this._endAccess(obj);
    }
  }

  _canReadKeys(obj) {
    return !this._getKeysErrorsByType.has(Object.getPrototypeOf(obj));
  }

  /**
   * `Object.keys` can also invoke user-defined functions.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/ownKeys*} obj
   */
  _getProperties(obj) {
    try {
      this._startAccess(obj);
      return Object.keys(obj);
    }
    catch (err) {
      this._onAccessError(obj, this._getKeysErrorsByType);
      return null;
    }
    finally {
      this._endAccess(obj);
    }
  }

  _startAccess(obj) {
    // TODO: disable tracing while reading the property
  }

  _endAccess(obj) {

  }

  _onAccessError(obj, errorsByType) {
    ++this._readErrorCount;

    // TODO: consider adding a timeout for floodgates?

    errorsByType.set(Object.getPrototypeOf(obj), obj);
    if (!(this._readErrorCount % 100)) {
      this.logger.error(`When copying object data, invoking object getters caused ${this._readErrorCount} exceptions (if this number is very high, you will likely observe significant slow-down)`);
    }
  }


  // ###########################################################################
  // serialize
  // ###########################################################################

  /**
   * @param {Map} visited
   */
  _serialize(value, depth = 1, visited = null, category = null) {
    // TODO: prevent infinite loops
    if (depth > SerializationConfig.maxDepth) {
      return this._addOmitted();
    }

    category = category || determineValueTypeCategory(value);

    // let serialized = serialize(category, value, serializationConfig);
    let serialized;
    let pruneState = ValuePruneState.Normal;
    let typeName = '';

    // infinite loop prevention
    if (isObjectCategory(category)) {
      if (!visited) {
        visited = new Map();
      }
      else {
        const existingValueRef = visited.get(value);
        if (existingValueRef) {
          return existingValueRef;
        }
      }
    }

    // process by category
    switch (category) {
      case ValueTypeCategory.String:
        if (value.length > SerializationConfig.maxStringLength) {
          serialized = value.substring(0, SerializationConfig.maxStringLength);
          pruneState = ValuePruneState.Shortened;
        }
        break;

      case ValueTypeCategory.Function:
        serialized = 'ƒ';
        // TODO: can have custom properties too
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
          const childRef = this._serialize(value, depth + 1, visited);
          serialized.push(childRef.valueId);
        }
        break;
      }

      case ValueTypeCategory.Object: {
        if (!this._canReadKeys(value)) {
          pruneState = ValuePruneState.Omitted;
        }
        else {
          // iterate over all object properties
          const props = this._getProperties(value);

          // NOTE: the name might be mangled. We ideally want to get it from source code when we can.
          //    (NOTE: not all types are instrumented by dbux)
          typeName = value.constructor?.name || '';

          // prune
          let n = props.length;
          if (n > SerializationConfig.maxObjectSize) {
            pruneState = ValuePruneState.Shortened;
            n = SerializationConfig.maxObjectSize;
          }

          // build object
          serialized = [];
          for (let i = 0; i < n; ++i) {
            const prop = props[i];
            let childRef;
            if (!this._canReadProperties(value)) {
              childRef = this._addOmitted();
            }
            else {
              const propValue = this._readProperty(value, prop);
              childRef = this._serialize(propValue, depth + 1, visited);
            }
            serialized.push([prop, childRef.valueId]);
          }
        }
        break;
      }

      default:
        serialized = value + '';
        break;
    }

    // add/register/track value
    const valueRef = this._addValue(value, category, typeName, serialized, pruneState);
    if (visited) {
      visited.set(value, valueRef);
    }
    return valueRef;
  }
}

const valueCollection = new ValueCollection();

export default valueCollection;