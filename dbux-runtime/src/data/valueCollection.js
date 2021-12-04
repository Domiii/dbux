import truncate from 'lodash/truncate';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import ValueTypeCategory, { determineValueTypeCategory, ValuePruneState, isTrackableCategory } from '@dbux/common/src/types/constants/ValueTypeCategory';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import serialize from '@dbux/common/src/serialization/serialize';
import { newLogger } from '@dbux/common/src/log/logger';
import { getOriginalFunction, getPatchedFunction, getUnpatchedCallbackOrPatchedFunction } from '../util/monkeyPatchUtil';
import Collection from './Collection';
import pools from './pools';
import DataNode from '@dbux/common/src/types/DataNode';


/** @typedef {import('@dbux/common/src/types/ValueRef').default} ValueRef */

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

// ###########################################################################
// values
// ###########################################################################

/**
 * WARNING: use carefully.
 */
export class VirtualRef {
  refId;
  participants = [];

  add(participant, prop) {
    if (this.refId) {
      participant[prop] = this.refId;
    }
    else {
      this.participants.push({ participant, prop });
    }
  }

  resolve(refId) {
    this.refId = refId;
    // [edit-after-send]
    for (const { participant, prop } of this.participants) {
      participant[prop] = refId;
    }
    this.participants = null;
  }
}


// ###########################################################################
// ValueCollection
// ###########################################################################

/**
 * Keeps track of `StaticTrace` objects that contain static code information
 */
class ValueCollection extends Collection {
  /**
   * NOTE: initialized from `RuntimeMonitor`
   */
  valuesDisabled;

  /**
   * hackfix: set `maybePatchPromise` to avoid dependency cycle.
   */
  maybePatchPromise;

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
  // Serializers
  // ###########################################################################

  errorSerializer = this.makeDefaultSerializer((err, valueRef) => {
    // [edit-after-send]
    valueRef.isError = true;
    return [
      ['name'], ['message'], ['stack'],
      /**
       * @see https://github.com/tc39/proposal-error-cause
       */
      ['cause']
    ];
  });

  builtInTypeSerializers = new Map([
    [Map, this.makeDefaultSerializer(obj => [['entries', obj.entries()]])],
    [Set, this.makeDefaultSerializer(obj => [['entries', obj.entries()]])],
    [RegExp, this.makeDefaultSerializer(obj => [['regex', obj.toString()]])]

    // TODO: thenables and many other built-ins
  ]);

  makeDefaultSerializer(f) {
    return (value, nodeId, depth, serialized, valueRef) => {
      const children = f(value, valueRef);
      for (const entry of children) {
        let [key] = entry;
        let childValue;
        if (entry.length > 1) {
          [, childValue] = entry;
        }
        else {
          childValue = this._readProperty(value, key);
        }
        const childRef = this._serialize(childValue, nodeId, depth + 1);
        this._pushObjectProp(depth, key, childRef, childValue, serialized);
      }
    };
  }

  getBuiltInSerializer(value) {

    if (!value.constructor || value === value.constructor.prototype) {
      // don't try to default-serialize a built-in prototype
      return null;
    }
    if (value instanceof Error) {
      // NOTE: should also work on Error sub-classes
      return this.errorSerializer;
    }
    return this.builtInTypeSerializers.get(value.constructor) || null;
  }


  /** ###########################################################################
   * placholders
   *  #########################################################################*/

  // lastPlaceholderId = 0;

  /**
   * hackfix: Placeholders are generic objects that are currently assumed to be fully resolved
   * before value actually gets sent out.
   * [edit-after-send]
   */
  generatePlaceholder() {
    return new VirtualRef();
  }

  /**
   * WARNING: use carefully.
   * @param {VirtualRef} placeholder
   */
  resolvePlaceholderId(refId, placeholder) {
    // const ref = this.getRefByValue(value);
    const ref = this.getById(refId);

    // [edit-after-send]
    // ref.placeholderId = placeholder._placeholderId;
    placeholder.resolve(ref.refId);
  }

  // ###########################################################################
  // public methods
  // ###########################################################################

  /**
   * @return {ValueRef}
   */
  getRefByValue(value) {
    value = unwrapValue(value);
    return this.valueRefsByObject.get(value);
  }

  _getRefByValueUnwrapped(value) {
    return this.valueRefsByObject.get(value);
  }

  /**
   * @param {DataNode} dataNode
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
      dataNode.value = this._serializeNonTrackable(value, category);
      dataNode.hasValue = dataNode.value !== undefined;
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
    // [edit-after-send]
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
   * Also needs to be error wrapped since instanceof can also be hi-jacked by user code.
   * This happens (for example) in Chart.js.
   */
  _getIsInstanceOf(obj, Clazz) {
    try {
      this._startAccess(obj);
      return obj instanceof Clazz;
    }
    catch (err) {
      this._onAccessError(obj, this._readErrorsByType);
      const msg = `ERROR: reading "${Object.getPrototypeOf(obj)} instanceof ${Clazz?.name}" caused exception`;
      VerboseErrors && this.logger.debug(msg, err.message);
      return `(${msg})`;
    }
    finally {
      this._endAccess(obj);
    }
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
    // NOTE: don't error out. We have nested access when traces disabled to get instanceof for wrapValue before the trace disabled check.
    // // eslint-disable-next-line no-undef
    // if (__dbux__._r.disabled) {
    //   this.logger.error(`Tried to start accessing object while already accessing another object - ${new Error().stack}`);
    //   return;
    // }

    // NOTE: disable tracing while reading the property

    // eslint-disable-next-line no-undef
    __dbux__._r.incBusy();
  }

  _endAccess() {
    // eslint-disable-next-line no-undef
    __dbux__._r.decBusy();
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

  _pushObjectProp(depth, key, childValueRef, childValue, serialized) {
    Verbose > 1 && this._logValue(`${' '.repeat(depth)}[${key}]`, childValueRef, childValue);

    serialized[key] = [
      childValueRef && childValueRef.refId,
      !childValueRef && this._serializeNonTrackable(childValue)
    ];
  }

  _serializeNonTrackable(value, category) {
    // category = value || determineValueTypeCategory(value);

    let serialized;
    // switch (category) {
    //   case ValueTypeCategory.String:
    if (isString(value)) {
      if (value.length > SerializationConfig.maxStringLength) {
        serialized = value.substring(0, SerializationConfig.maxStringLength) + '...';
        // pruneState = ValuePruneState.Shortened;
      }
      else {
        serialized = value;
      }
      // serialized = JSON.stringify(value);
    }
    else {
      const t = typeof value;
      if (t === 'bigint') {
        /**
         * hackfix: coerce to string
         * NOTE: JSON + msgpack both don't support bigint
         * @see https://github.com/Domiii/dbux/issues/533
         */
        serialized = value + 'n';
      }
      else if (t === 'symbol') {
        /**
         * hackfix: coerce to string
         * NOTE: msgpack (notepack) does not support symbols
         * @see https://github.com/darrachequesne/notepack/issues
         */
        serialized = value.toString();
      }
      else {
        serialized = value;
      }
    }
    // this.logger.warn('_serializeNonTrackable', value, serialized);
    return serialized;
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

    if (this.valuesDisabled) {
      return this._addValueDisabled();
    }
    if (depth > SerializationConfig.maxDepth) {
      return this.addOmitted();
    }

    // unwrap
    value = unwrapValue(value);

    // look-up existing value
    category = category || determineValueTypeCategory(value);
    if (!isTrackableCategory(category)) {
      return null;
    }
    valueRef = this._getRefByValueUnwrapped(value);
    if (valueRef) {
      // object already referenced

      // [edit-after-send]
      // hackfix: sometimes, objects are referenced before their DataNode was created (e.g. promises returned from `then`)
      // also see: DataNodeCollection#createBCEDataNode
      valueRef.nodeId = valueRef.nodeId || nodeId;

      return valueRef;
    }

    // new ref
    valueRef = this._addValueRef(category, nodeId, value);

    if (meta?.shallow) {
      // shortcut -> don't serialize children
      typeName = value.constructor?.name || '';
      this._finishValue(valueRef, typeName, Array.isArray(value) ? EmptyArray : EmptyObject, pruneState);
      return valueRef;
    }

    // serialize value

    // TODO: only store values, if `isNewObject || staticTrace.dataNode.isNew` (mostly helps avoid copying cost of long strings)
    // TODO: in general, find a better way to deal with strings (don't want to arbitrarily copy long strings)


    // process by category

    switch (category) {
      case ValueTypeCategory.Function: {
        // TODO: look up staticContext information by function for `name` instead?
        // TODO: functions can have custom properties too
        serialized = {};
        this._pushObjectProp(depth, 'name', null, (value.name || ''), serialized);
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
          let childRef, childValue;
          if (!this._canAccess(value)) {
            childRef = this.addOmitted();
          }
          else {
            childValue = this._readProperty(value, i);
            childRef = this._serialize(childValue, nodeId, depth + 1);
          }
          Verbose > 1 && this._logValue(`${' '.repeat(depth)}[${i}]`, childRef, childValue);

          serialized.push([childRef?.refId, !childRef && this._serializeNonTrackable(childValue)]);
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

          // check for promise
          const thenRepresentation = value && this._readProperty(value, 'then');
          valueRef.isThenable = thenRepresentation && isFunction(thenRepresentation);
          if (valueRef.isThenable) {
            this.maybePatchPromise(value);
          }

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

            const builtInSerializer = this.getBuiltInSerializer(value);
            if (builtInSerializer) {
              // serialize built-in types - especially: RegExp, Map, Set
              builtInSerializer(value, nodeId, depth, serialized, valueRef);
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

/** ###########################################################################
 * wrapping of values
 * ##########################################################################*/

export function wrapValue(value) {
  if (valueCollection._getIsInstanceOf(value, Function)) {
    // value = getUnpatchedCallbackOrPatchedFunction(value);
    value = getPatchedFunction(value);
  }
  return value;
}

export function unwrapValue(value) {
  if (valueCollection._getIsInstanceOf(value, Function)) {
    // TODO: handle callback identity?
    value = getOriginalFunction(value) || value;
  }
  return value;
}

export default valueCollection;