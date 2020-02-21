import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';

import Enum from '../../util/Enum';

/**
 * 
 */
let ValueRefCategory = {
  /**
   * Primitives have a small, fixed size
   */
  Primitive: 1,

  Function: 2,
  String: 3,
  Array: 3,
  Object: 4
};

ValueRefCategory = new Enum(ValueRefCategory);

export function determineValueRefCategory(value) {
  if (isFunction(value)) {
    return ValueRefCategory.Function;
  }
  if (isString(value)) {
    return ValueRefCategory.String;
  }
  if (isArray(value)) {
    return ValueRefCategory.Array;
  }
  if (isObject(value)) {
    return ValueRefCategory.Object;
  }
  return ValueRefCategory.Primitive;
}

export default ValueRefCategory;