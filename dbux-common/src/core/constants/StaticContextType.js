import Enum from "../../util/Enum";

/**
 * TODO: merge with ExecutionContextType. No need for the two to be different.
 */
let StaticContextType = {
  Program: 1,
  Function: 2,
  Await: 3,
  Resume: 4
};
StaticContextType = new Enum(StaticContextType);

export default StaticContextType;