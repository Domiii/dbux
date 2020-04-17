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

  [ValueTypeCategory.Array]: SerializationMethod.Object,
  [ValueTypeCategory.Object]: SerializationMethod.Object
};

function getBestMethod(category, value) {
  return category2Method[category];
}

const serializers = {
  [SerializationMethod.Function](x) {
    // TODO: add serious Function tracking
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

  [SerializationMethod.Object](x) {
    if (isArray(x)) {
      // array
      // TODO
    }
    else {
      // object
      // TODO
    }
  }
};

export default function serialize(category, inputValue) {
  // TODO: largely improve this process!
  const method = getBestMethod(category, inputValue);

  let serializedValue;

  try {
    serializedValue = serializers[method](inputValue);
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