import Enum from "../../util/Enum";

/**
 * TODO: merge with ExecutionContextType. No need for the two to be different.
 */
// eslint-disable-next-line import/no-mutable-exports
let patternAstNodeTypeObj = {
  Prop: 1,
  Array: 2,
  Object: 3,
  Rest: 4
};
const PatternAstNodeType = new Enum(patternAstNodeTypeObj);

export default PatternAstNodeType;
