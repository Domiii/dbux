import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let SpecialIdentifierType = {
  Module: 1,
  Arguments: 2
};

// @type {(Enum|typeof SpecialIdentifierType)}
/**
 * 
 * @type {(Enum)}
 */
SpecialIdentifierType = new Enum(SpecialIdentifierType);

export default SpecialIdentifierType;