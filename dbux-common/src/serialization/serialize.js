import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import { newLogger } from 'dbux-common/src/log/logger';
import SerializationMethod from './SerializationMethod';
import ValueTypeCategory from '../core/constants/ValueTypeCategory';

const { log, debug, warn, error: logError } = newLogger('serialize');

const category2Method = {
  [ValueTypeCategory.Function]: SerializationMethod.Function,

  [ValueTypeCategory.Primitive]: SerializationMethod.ToString,
  [ValueTypeCategory.String]: SerializationMethod.ToString,

  [ValueTypeCategory.Array]: SerializationMethod.JSON,
  [ValueTypeCategory.Object]: SerializationMethod.JSON
};

function getBestMethod(category, value) {
  return category2Method[category];
}

// function stringify(val, depth, replacer, space) {
//   depth = isNaN(+depth) ? 1 : depth;
//   function _build(key, val, depth, o, a) { // (JSON.stringify() has it's own rules, which we respect here by using it for property iteration)
//     return !val || typeof val != 'object' ? val : (a = Array.isArray(val), JSON.stringify(val, function (k, v) { if (a || depth > 0) { if (replacer) v = replacer(k, v); if (!k) return (a = Array.isArray(v), val = v); !o && (o = a ? [] : {}); o[k] = _build(k, v, a ? depth : depth - 1); } }), o || (a ? [] : {}));
//   }
//   return JSON.stringify(_build('', val, depth), null, space);
// }

function doSerialize(method, x) {
  // const method = getBestMethod(category, x);

  serializedValue = serializers[method](x);
}

// ###########################################################################
// complexSerializer
// ###########################################################################

const serializers = {
  [SerializationMethod.Function](x) {
    return 'ƒ';
  },

  // [SerializationMethod.JSON](x) {
  //   return JSON.stringify(x);
  // },

  [SerializationMethod.ToString](x) {
    // NOTE: usual `toString` operations don't work on objects with null prototype
    //        (e.g.: var x = Object.create(null))
    return `${x}`;
  },

  // [SerializationMethod.Object](x) {
  //   if (isArray(x)) {
  //     // array
  //     // TODO
  //   }
  //   else {
  //     // object
  //     // TODO
  //   }
  // }
};

export default function serialize(category, inputValue) {
  // TODO: largely improve this process!
  let serializedValue;
  const method = getBestMethod(category, inputValue);

  try {
    serializedValue = doSerialize(method, inputValue);
  }
  catch (err) {
    warn('could not serialize object', inputValue, err);
    serializedValue = inputValue;
  }

  return {
    method,
    value: serializedValue
  };
}