import { buildTraceExpression } from './builders/trace';

export function traceWrapExpression(expressionPath, state, traceCfg) {
  // if (t.isLiteral(node)) {
  //   // don't care about literals
  //   return;
  // }
  const newNode = buildTraceExpression(expressionPath, state, traceCfg);
  expressionPath.replaceWith(newNode);

  const orig = expressionPath.get('arguments.1');
  state.onCopy(expressionPath, orig);
  
  return orig;
}