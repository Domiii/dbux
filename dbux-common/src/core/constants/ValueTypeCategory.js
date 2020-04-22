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
  Object: 3,
  Array: 4,
  Function: 5
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

export function isCategoryComplex(category) {
  return category >= ValueTypeCategory.Object;
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