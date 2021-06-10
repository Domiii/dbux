import * as t from "@babel/types";

export const ZeroNode = t.numericLiteral(0);
export const NullNode = t.nullLiteral();
export const UndefinedNode = t.identifier('undefined');

export function makeInputs(inputTraces) {
  return inputTraces &&
    t.arrayExpression(inputTraces.map(trace => trace.tidIdentifier)) ||
    NullNode;
}

export function getTraceCall(state, traceCfg, defaultCall = 'traceExpression') {
  const { ids: { aliases } } = state;
  const trace = aliases[traceCfg?.meta?.traceCall || defaultCall];
  if (!trace) {
    throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
  }
  return trace;
}