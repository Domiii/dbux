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

  // NOTE: types past NaN are named as-is
  NaN: 100,
  Infinity: 101
};

// @type {(Enum|typeof SpecialIdentifierType)}
/**
 * 
 * @type {(Enum)}
 */
SpecialIdentifierType = new Enum(SpecialIdentifierType);


const TypesByIdentifierName = Object.fromEntries(
  SpecialIdentifierType.values
    .map(val => {
      let name = SpecialIdentifierType.nameFromForce(val);
      if (val < SpecialIdentifierType.NaN) {
        // NOTE: types before NaN are lower-case versions of the type name
        name = name[0].toLowerCase() + name.substring(1);
      }
      return [name, val];
    })
);


export function lookupSpecialIdentifierType(identifierName) {
  return TypesByIdentifierName[identifierName];
}

const notTraceable = new Array(SpecialIdentifierType.getValueMaxIndex()).map(() => false);
notTraceable[SpecialIdentifierType.Eval] = true;
notTraceable[SpecialIdentifierType.Require] = true;
notTraceable[SpecialIdentifierType.Super] = true;

export function isNotTraceable(type) {
  return notTraceable[type];
}

export default SpecialIdentifierType;