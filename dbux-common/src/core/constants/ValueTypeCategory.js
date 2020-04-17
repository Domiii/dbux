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

  Function: 2,
  String: 3,
  Array: 3,
  Object: 4
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

export default ValueTypeCategory;