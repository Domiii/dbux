import Enum from 'dbux-common/src/util/Enum';

const StaticContextType = new Enum({
  Program: 1,
  Function: 2,
  CallExpression: 3
});

export default StaticContextType;