import * as t from "@babel/types";

export const ZeroNode = t.numericLiteral(0);
export const NullNode = t.nullLiteral();
export const UndefinedNode = t.identifier('undefined');

export function makeInputs(inputTraces) {
  return inputTraces &&
    t.arrayExpression(inputTraces.map(trace => trace.tidIdentifier)) ||
    NullNode;
}