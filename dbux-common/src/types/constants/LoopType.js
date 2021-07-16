import Enum from "../../util/Enum";

/**
 * TODO: merge with ExecutionContextType. No need for the two to be different.
 */
// eslint-disable-next-line import/no-mutable-exports
let LoopType = {
  For: 1,
  ForIn: 2,
  ForOf: 3,
  While: 4,
  DoWhile: 5,
  ForAwaitOf: 6
};
LoopType = new Enum(LoopType);

export default LoopType;