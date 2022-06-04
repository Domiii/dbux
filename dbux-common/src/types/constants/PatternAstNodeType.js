import Enum from "../../util/Enum";

/**
 * TODO: merge with ExecutionContextType. No need for the two to be different.
 */
// eslint-disable-next-line import/no-mutable-exports
let patternAstNodeTypeObj = {
  Array: 1,
  Object: 2,
  Var: 3,
  ME: 4,
  Rest: 5
};
const PatternAstNodeType = new Enum(patternAstNodeTypeObj);

export default PatternAstNodeType;
