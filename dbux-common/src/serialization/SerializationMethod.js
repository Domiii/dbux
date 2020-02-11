import Enum from '../util/Enum';

/**
 * 
 */
let SerializationMethod = {
  ToString: 1,
  JSON: 2
};

SerializationMethod = new Enum(SerializationMethod);

export default SerializationMethod;