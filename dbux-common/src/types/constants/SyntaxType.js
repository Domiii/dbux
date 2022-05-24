import Enum from '../../util/Enum';

const syntaxTypeObj = {
  AssignmentLValVar: 1,
  AssignmentLValME: 2,
  If: 10,
  Switch: 11,
  Ternary: 12,
  For: 13,
  ForIn: 14,
  ForOf: 15,
  While: 16,
  DoWhile: 17,
};

/**
 * We use this for what is essentially small and naive symbolic execution.
 * 
 * @type {(Enum|typeof syntaxTypeObj)}
 */
const SyntaxType = new Enum(syntaxTypeObj);

export default SyntaxType;
