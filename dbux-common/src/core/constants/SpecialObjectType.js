import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let SpecialObjectType = {
  Arguments: 2,
};

// @type {(Enum|typeof SpecialObjectType)}
/**
 * @type {(Enum)}
 */
SpecialObjectType = new Enum(SpecialObjectType);

export default SpecialObjectType;