import Enum from '../../util/Enum';

const syntaxTypeObj = {
  AssignmentLValVar: 1,
  AssignmentLValME: 2
};

/**
 * We use this for what is essentially small and naive symbolic execution.
 * 
 * @type {(Enum|typeof syntaxTypeObj)}
 */
const SyntaxType = new Enum(syntaxTypeObj);

export default SyntaxType;
