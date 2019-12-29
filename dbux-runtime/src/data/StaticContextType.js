import Enum from 'dbux-common/src/util/Enum';

const StaticContextType = new Enum({
  Program: 1,
  Function: 2,
  CallExpressionArgument: 3,
  AwaitExpression: 4
});

export default StaticContextType;