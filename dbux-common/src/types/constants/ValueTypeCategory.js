import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';

import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let ValueTypeCategoryObj = {
  /**
   * Primitives have a small, fixed size, primarily: number, bool
   */
  Primitive: 1,
  String: 2,

  // complex types
  Function: 3,
  Object: 4,
  Array: 5
};

const ValueTypeCategory = new Enum(ValueTypeCategoryObj);

export function determineValueTypeCategory(value) {
  if (isFunction(value)) {
    return ValueTypeCategory.Function;
  }
  if (isString(value)) {
    return ValueTypeCategory.String;
  }
  if (isArray(value)) {
    return ValueTypeCategory.Array;
  }
  if (isObject(value)) {
    return ValueTypeCategory.Object;
  }
  return ValueTypeCategory.Primitive;
}

export function isObjectCategory(category) {
  return category >= ValueTypeCategory.Function;
}

const SimpleStringByType = {
  [ValueTypeCategory.Array]: '[]',
  [ValueTypeCategory.Object]: '{}',
  [ValueTypeCategory.Function]: 'ƒ',
};
export function getSimpleTypeString(category) {
  return SimpleStringByType[category];
}

/**
 * NOTE: strings are not trackable because `WeakMap` cannot index them.
 *    (That is because we can construct two strings that are equal according to `===` but are not referencing the same string.)
 */
export function isTrackableCategory(category) {
  return isObjectCategory(category);
}

export function isPlainObjectOrArrayCategory(category) {
  return category >= ValueTypeCategory.Object;
}

export function isPlainObjectCategory(category) {
  return ValueTypeCategory.is.Object(category);
}

export function isFunctionCategory(category) {
  return ValueTypeCategory.is.Function(category);
}

export default ValueTypeCategory;


// ###########################################################################
// ValuePruneState
// ###########################################################################

// eslint-disable-next-line import/no-mutable-exports
let ValuePruneState = {
  Normal: 0,
  Omitted: 1,     // TODO: fix ordering → Omitted should be after Shortened
  Shortened: 2,
  ValueDisabled: 3,
  ReadError: 4
};

ValuePruneState = new Enum(ValuePruneState);

const okPruneStates = new Array(ValuePruneState.getValueMaxIndex()).map(() => false);
okPruneStates[ValuePruneState.Normal] = true;
okPruneStates[ValuePruneState.Shortened] = true;

export function isPruneStateOk(pruneState) {
  return okPruneStates[pruneState] || false;
}

export {
  ValuePruneState
};