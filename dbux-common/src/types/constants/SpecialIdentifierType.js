import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let SpecialIdentifierType = {
  Module: 1,
  /**
   * Linked against {@link SpecialObjectType}.
   * TODO: Does not seem like we are using this?
   */
  Arguments: 2,
  /**
   * TODO: Does not seem like we are using this?
   */
  Undefined: 3,
  Eval: 4,
  
  // future-work: consider `@babel/traverse` -> referencesImport
  Require: 10,
  Import: 11,

  This: 20,
  Super: 21,

  // NOTE: types past NaN are named as-is
  NaN: 100,
  Infinity: 101,
  Proxy: 102
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
        // hackfix: types before NaN are lower-case versions of the type name
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
notTraceable[SpecialIdentifierType.Import] = true;
notTraceable[SpecialIdentifierType.Super] = true;
// NOTE: Proxy is traceable, but the proxy object's value should not be iterated over.
// notTraceable[SpecialIdentifierType.Proxy] = true;

export function isNotCalleeTraceableType(type) {
  return notTraceable[type];
}


const argsNotTraceableIfConstant = new Array(SpecialIdentifierType.getValueMaxIndex()).map(() => false);
argsNotTraceableIfConstant[SpecialIdentifierType.Require] = true;
argsNotTraceableIfConstant[SpecialIdentifierType.Import] = true;
argsNotTraceableIfConstant[SpecialIdentifierType.Super] = true;

export function isNotArgsTraceableIfConstantType(type) {
  return argsNotTraceableIfConstant[type];
} 

export default SpecialIdentifierType;