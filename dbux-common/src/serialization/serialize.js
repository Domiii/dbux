import SerializationMethod from './SerializationMethod';

function getBestMethod(value) {
  if ('toJSON' in value) {
    return SerializationMethod.JSON;
  }
  return SerializationMethod.ToString;
}

const serializers = {
  [SerializationMethod.JSON](x) {
    return JSON.stringify(x);
  },

  [SerializationMethod.ToString](x) {
    return x.toString();
  }
};

export default function serialize(inputValue) {
  // TODO: largely improve this process!
  const method = getBestMethod(inputValue);
  const serializedValue = serializers[method](inputValue);

  return {
    method,
    value: serializedValue
  }
}