import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let SpecialIdentifierType = {
  Module: 1,
  Arguments: 2,
  Eval: 3,
  Require: 4,
  This: 5,
  Super: 6,
  Undefined: 20,

  // NOTE: types past NaN are upper case
  NaN: 100,
  Infinity: 101
};

// @type {(Enum|typeof SpecialIdentifierType)}
/**
 * 
 * @type {(Enum)}
 */
SpecialIdentifierType = new Enum(SpecialIdentifierType);



export function lookupSpecialIdentifierType(identifierName) {
  const testName = identifierName[0].toUpperCase() + identifierName.substring(1);
  const type = SpecialIdentifierType[testName];
  if (type &&
    (type >= SpecialIdentifierType.NaN || identifierName[0] === identifierName[0].toLowerCase())) {
    return type;
  }
  return null;
}

const notTraceable = new Array(SpecialIdentifierType.getValueMaxIndex()).map(() => false);
notTraceable[SpecialIdentifierType.Eval] = true;
notTraceable[SpecialIdentifierType.Require] = true;
notTraceable[SpecialIdentifierType.Super] = true;

export function isNotTraceable(type) {
  return notTraceable[type];
}

export default SpecialIdentifierType;