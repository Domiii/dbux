import truncate from 'lodash/truncate';
import ValueTypeCategory, { determineValueTypeCategory, ValuePruneState, isTrackableCategory } from '@dbux/common/src/core/constants/ValueTypeCategory';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import serialize from '@dbux/common/src/serialization/serialize';
import { newLogger } from '@dbux/common/src/log/logger';
import Collection from './Collection';
import pools from './pools';

/** @typedef {import('@dbux/common/src/core/data/ValueRef').default} ValueRef */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RuntimeMonitor');

// const Verbose = true;
const Verbose = false;
// const VerboseErrors = Verbose || true;
const VerboseErrors = Verbose || false;

const SerializationConfig = {
  maxDepth: 4,          // applies to arrays and object
  maxObjectSize: 50,    // applies to arrays and object
  maxStringLength: 1000
};

const builtInTypeSerializers = new Map([
  [Map, obj => [['entries', obj.entries()]]],
  [Set, obj => [['entries', obj.entries()]]],
  [RegExp, obj => [['regex', obj.toString()]]]

  // TODO: thenables and many other built-ins
]);

/**
 * Keeps track of `StaticTrace` objects that contain static code information
 */
class ValueCollection extends Collection {
  /**
   * NOTE: initialized from `RuntimeMonitor`
   */
  valuesDisabled;

  /**
   * Stores `refId` by `object`.
   * [future-work] In order to reduce memory pressure, collections need to be "cleaned over time" first.
   *        Only then, using `WeakMap` instead of `Map` here would be worth it.
   * @type {Map<object, number>}
   */
  valueRefsByObject = new Map();
  _lastRefId = 0;

  constructor() {
    super('values');
  }


  // ###########################################################################
  // public methods
  // ###########################################################################

  getRefByValue(value) {
    return this.valueRefsByObject.get(value);
  }

  /**
   * 
   * @returns {ValueRef}
   */
  registerValueMaybe(value, dataNode, meta = null) {
    if (this.valuesDisabled) {
      return null;
    }

    let valueRef;
    const { nodeId } = dataNode;
    const category = determineValueTypeCategory(value);
    Verbose > 1 && this._log(`[val] dataNode #${nodeId}`);
    if (!isTrackableCategory(category)) {
      valueRef = null;

      // hackfix: coerce to string
      // NOTE: workaround for https://github.com/Domiii/dbux/issues/533
      if (typeof value === 'bigint') {
        value = value + 'n';
      }
      dataNode.value = value;
    }
    else {
      valueRef = this._serialize(value, nodeId, 1, category, meta);
      dataNode.value = undefined;
    }
    Verbose && this._logValue(`[/val] dataNode #${nodeId}:`, valueRef, category, value);
    return valueRef;
  }

  // ###########################################################################
  // misc private methods
  // ###########################################################################

  /**
   * 
   * @param {*} value 
   * @param {*} category
   * @return {ValueRef}
   */
  _addValueRef(category = null, nodeId = null, value = null) {
    // create new ref + track object value
    // Verbose && debug(`addValueRef (nodeId=${nodeId}):`, value);
    const valueRef = pools.values.allocate();
    valueRef.refId = this._all.length;
    this.push(valueRef);
    if (value) {
      this.valueRefsByObject.set(value, valueRef);
    }

    valueRef.nodeId = nodeId;
    valueRef.category = category;

    // mark for sending
    this._send(valueRef);

    return valueRef;
  }

  _log(...args) {
    this.logger.log(...args);
  }

  _logValue(prefix, valueRef, value) {
    const category = ValueTypeCategory.nameFrom(determineValueTypeCategory(value));
    if (valueRef) {
      this._log(`${prefix}${ValueTypeCategory.nameFrom(category)} -`, value);
    }
    else {
      this._log(`${prefix}${ValueTypeCategory.nameFrom(category)} (ref #${valueRef.refId} (${valueRef.nodeId})) - ${truncate(valueRef.serialized, { length: 100 })})`);
    }
  }

  // /**
  //  * Look-up refId of given object value.
  //  * NOTE: In case of internal errors, `refId` might be set, but it might not have been registered.
  //  */
  // trackObjectRef(value) {
  //   // if (value === undefined) {
  //   //   this.logger.warn(new Error(`Tried to track value but is undefined`).stack);
  //   // }
  //   let refId;
  //   try {
  //     this.trackedRefs.set(value, refId = ++this._lastRefId);
  //   }
  //   catch (err) {
  //     let typeInfo = typeof value;
  //     if (isObject(value)) {
  //       typeInfo += ` (${Object.getPrototypeOf(value)})`;
  //     }
  //     logError(`could not store value ("${err.message}"): ${typeInfo} ${JSON.stringify(value)}`);
  //   }
  //   return refId;
  // }

  /**
   * @return {ValueRef}
   */
  addOmitted() {
    if (!this._omitted) {
      this._omitted = this._addValueRef();
      this._finishValue(this._omitted, null, '(...)', ValuePruneState.Omitted);
    }
    return this._omitted;
  }

  /**
   * @return {ValueRef}
   */
  _addValueDisabled() {
    if (!this._valueDisabled) {
      this._valueDisabled = this._addValueRef();
      this._finishValue(this._valueDisabled, null, '(...)', ValuePruneState.ValueDisabled);
    }
    return this._valueDisabled;
  }

  /**
   * 
   * @param {ValueRef} valueRef
   * @return {ValueRef}
   */
  _finishValue(valueRef, typeName, serialized, pruneState = null) {
    // store all other props
    valueRef.typeName = typeName;
    valueRef.pruneState = pruneState;
    valueRef.serialized = serialized;

    return valueRef;
  }


  // ###########################################################################
  // bubblewrap when accessing object properties
  // ###########################################################################

  _readErrorCount = 0;
  _readErrorsByType = new Map();
  _getKeysErrorsByType = new Map();

  /**
   * Heuristic to determine whether this (probably) is safe to access,
   * based on past error observations.
   */
  _canAccess(obj) {
    // TODO: `Object.getPrototypeOf` can trigger a proxy trap; need to check on that as well.

    // check if objects of this type have already been floodgated
    return !this._readErrorsByType.has(Object.getPrototypeOf(obj));
  }

  _canReadKeys(obj) {
    // if (obj.constructor?.prototype === obj) {
    //   // NOTE: we cannot read properties of many built-in prototype objects
    //   // e.g. `NodeList.prototype`
    //   return false;
    // }

    // TODO: `getPrototypeOf` can trigger a proxy trap
    return !this._getKeysErrorsByType.has(Object.getPrototypeOf(obj));
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
      const msg = `ERROR: accessing ${Object.getPrototypeOf(obj)}.${key} caused exception`;
      VerboseErrors && this.logger.debug(msg, err.message);
      return `(${msg})`;
    }
    finally {
      this._endAccess(obj);
    }
  }

  /**
   * 
   */
  _getProperties(obj) {
    try {
      this._startAccess(obj);

      // NOTE: `for in` gets a lot of enumerable properties that `Object.keys` does not get
      const keys = [];
      for (const key in obj) {
        // if (!isFunction(obj[key])) {
        keys.push(key);
        // }
      }
      return keys;

      // // `Object.keys` can also invoke user - defined functions.
      // // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/ownKeys*} obj
      // return Object.keys(obj);
    }
    catch (err) {
      VerboseErrors && this.logger.debug(`accessing object ${Object.getPrototypeOf(obj)} caused exception:`, err.message);
      this._onAccessError(obj, this._getKeysErrorsByType);
      return null;
    }
    finally {
      this._endAccess(obj);
    }
  }

  _startAccess(/* obj */) {
    // eslint-disable-next-line no-undef
    if (__dbux__._r.disabled) {
      this.logger.error(`Tried to start accessing object while already accessing another object - ${new Error().stack}`);
      return;
    }

    // NOTE: disable tracing while reading the property

    // eslint-disable-next-line no-undef
    __dbux__._r.incDisabled();
  }

  _endAccess() {
    // eslint-disable-next-line no-undef
    __dbux__._r.decDisabled();
  }

  _onAccessError(obj, errorsByType) {
    // TODO: consider adding a timeout for floodgates?
    ++this._readErrorCount;

    errorsByType.set(Object.getPrototypeOf(obj), obj);
    if ((this._readErrorCount % 100) === 0) {
      // eslint-disable-next-line max-len,no-console
      console.warn(`[Dbux] When Dbux records object data it blatantly invokes object getters. These object getters caused ${this._readErrorCount} exceptions. If this number is very high, you will likely observe significant slow-down.`);
    }
  }


  // ###########################################################################
  // serialize
  // ###########################################################################

  _pushObjectProp(depth, prop, valueRef, value, serialized) {
    Verbose > 1 && this._logValue(`${' '.repeat(depth)}[${prop}]`, valueRef, value);

    serialized[prop] = [valueRef && valueRef.refId, !valueRef && value];
  }

  /**
   * @param {Map} visited
   * @return {ValueRef}
   */
  _serialize(value, nodeId, depth = 1, category = null, meta = null) {
    // let serialized = serialize(category, value, serializationConfig);
    let serialized;
    let pruneState = ValuePruneState.Normal;
    let typeName = '';
    let valueRef;
    let isNewObject = false;

    if (this.valuesDisabled) {
      return this._addValueDisabled();
    }
    if (depth > SerializationConfig.maxDepth) {
      return this.addOmitted();
    }

    // look-up existing value
    category = category || determineValueTypeCategory(value);
    if (!isTrackableCategory(category)) {
      return null;
    }
    valueRef = this.getRefByValue(value);
    if (!valueRef) {
      isNewObject = true;
      valueRef = this._addValueRef(category, nodeId, value);
    }

    if (!isNewObject) {
      return valueRef;
    }
    if (meta?.shallow) {
      this._finishValue(valueRef, typeName, Array.isArray(value) ? EmptyArray : EmptyObject, pruneState);
      return valueRef;
    }

    if (meta?.omit) {
      // shortcut -> don't serialize children
      typeName = value.constructor?.name || '';
      this._finishValue(valueRef, typeName, EmptyArray, ValuePruneState.Omitted);
      return valueRef;
    }

    // serialize value

    // TODO: only store values, if `isNewObject || staticTrace.dataNode.isNew` (mostly helps avoid copying cost of long strings)
    // TODO: in general, find a better way to deal with strings (don't want to arbitrarily copy long strings)


    // process by category
    switch (category) {
      case ValueTypeCategory.String:
        if (value.length > SerializationConfig.maxStringLength) {
          serialized = value.substring(0, SerializationConfig.maxStringLength);
          pruneState = ValuePruneState.Shortened;
        }
        else {
          serialized = value;
        }
        break;

      case ValueTypeCategory.Function: {
        // TODO: look up staticContext information by function instead
        // TODO: functions can have custom properties too
        serialized = {};
        this._pushObjectProp(depth, 'name', null, 'ƒ ' + (value.name || ''), serialized);
        const prototypeRef = this._serialize(value.prototype, nodeId, depth + 1);
        this._pushObjectProp(depth, 'prototype', prototypeRef, null, serialized);
        break;
      }

      case ValueTypeCategory.Array: {
        let n = value.length;
        if (n > SerializationConfig.maxObjectSize) {
          pruneState = ValuePruneState.Shortened;
          n = SerializationConfig.maxObjectSize;
        }

        // build array
        serialized = [];
        for (let i = 0; i < n; ++i) {
          const childValue = value[i];

          const childRef = this._serialize(childValue, nodeId, depth + 1);
          Verbose > 1 && this._logValue(`${' '.repeat(depth)}[${i}]`, childRef, childValue);

          serialized.push([childRef?.refId, !childRef && childValue]);
        }
        break;
      }

      case ValueTypeCategory.Object: {
        if (!this._canReadKeys(value)) {
          pruneState = ValuePruneState.Omitted;
        }
        else {
          // iterate over all object properties
          let props = this._getProperties(value);

          if (!props) {
            // error
            serialized = `(ERROR: accessing object caused exception)`;
            category = ValueTypeCategory.String;
            pruneState = ValuePruneState.Omitted;
          }
          else {
            // future-work: the name might be mangled. We ideally want to get it from source code when we can.
            typeName = value.constructor?.name || '';

            // prune
            let n = props.length;
            if (n > SerializationConfig.maxObjectSize) {
              pruneState = ValuePruneState.Shortened;
              n = SerializationConfig.maxObjectSize;
            }

            // start serializing
            serialized = {};

            const builtInSerializer = value.constructor ? builtInTypeSerializers.get(value.constructor) : null;
            if (builtInSerializer) {
              // serialize built-in types - especially: RegExp, Map, Set
              const entries = builtInSerializer(value);
              for (const [prop, childValue] of entries) {
                const childRef = this._serialize(value, nodeId, depth + 1);
                this._pushObjectProp(depth, prop, childRef, childValue, serialized);
              }
            }
            else {
              // serialize object (default)
              for (let i = 0; i < n; ++i) {
                const prop = props[i];
                let childRef;
                let childValue;
                if (!this._canAccess(value)) {
                  childRef = this.addOmitted();
                }
                else {
                  childValue = this._readProperty(value, prop);
                  childRef = this._serialize(childValue, nodeId, depth + 1);
                }
                this._pushObjectProp(depth, prop, childRef, childValue, serialized);
              }
            }
          }
        }
        break;
      }

      default:
        serialized = value;
        break;
    }

    // finish value
    this._finishValue(valueRef, typeName, serialized, pruneState);
    return valueRef;
  }
}

const valueCollection = new ValueCollection();

export default valueCollection;