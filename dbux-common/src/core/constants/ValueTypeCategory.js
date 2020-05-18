import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';

import Enum from '../../util/Enum';

/**
 * 
 */
let ValueTypeCategory = {
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

ValueTypeCategory = new Enum(ValueTypeCategory);

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

export function isPlainObjectOrArrayCategory(category) {
  return category >= ValueTypeCategory.Object;
}

export function isFunctionCategory(category) {
  return ValueTypeCategory.is.Function(category);
}

export default ValueTypeCategory;


// ###########################################################################
// ValuePruneState
// ###########################################################################

let ValuePruneState = {
  Normal: 0,
  Omitted: 1,
  Shortened: 2
};

ValuePruneState = new Enum(ValuePruneState);

export {
  ValuePruneState
};