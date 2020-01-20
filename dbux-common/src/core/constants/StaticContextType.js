import Enum from "../../util/Enum";

let StaticContextType = {
  Program: 1,
  Function: 2,
  CallExpressionArgument: 3,
  AwaitExpression: 4,
  ResumeAfterInterrupt: 5
};
StaticContextType = new Enum(StaticContextType);

export default StaticContextType;