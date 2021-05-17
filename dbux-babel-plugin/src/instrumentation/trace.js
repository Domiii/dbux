import { buildTraceExpression } from './builders/trace';

export function traceWrapExpression(expressionPath, state, traceCfg, bindingTidIdentifier, inputTidIds) {
  // if (t.isLiteral(node)) {
  //   // don't care about literals
  //   return;
  // }
  const newNode = buildTraceExpression(expressionPath, state, traceCfg, bindingTidIdentifier, inputTidIds);
  expressionPath.replaceWith(newNode);

  const orig = expressionPath.get('arguments.1');
  state.onCopy(expressionPath, orig);
  
  return orig;
}