import SerializationMethod from './SerializationMethod';

const deserializers = {
  [SerializationMethod.JSON](x) {
    return JSON.parse(x);
  },

  [SerializationMethod.ToString](x) {
    // there is no inverse to the `toString` method, so we can't really do much
    return x;
  }
};

export default function deserialize(serialized) {
  // TODO: largely improve this process!
  const { 
    method, 
    value: serializedValue 
  } = serialized;

  return deserializers[method](serializedValue);
}