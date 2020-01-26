import Enum from '../../util/Enum';

import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';

/**
 * 
 */
let ValueRefType = {
  /**
   * Primitives have a small, fixed size
   */
  Primitive: 1,

  String: 2,
  Object: 3,
  Array: 4
};

ValueRefType = new Enum(ValueRefType);

export function determineValueRefType(value) {
  if (isString(value)) {
    return ValueRefType.String;
  }
  if (isObject(value)) {
    return ValueRefType.Object;
  }
  if (isArray(value)) {
    return ValueRefType.Array;
  }
}

export default ValueRefType;