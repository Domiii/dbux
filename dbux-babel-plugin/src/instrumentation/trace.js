import * as t from '@babel/types';
import { buildTraceExpression, buildTraceId, buildTraceWrite } from './builders/trace';

export function traceWrapExpression(expressionPath, state, traceCfg) {
  // if (t.isLiteral(node)) {
  //   // don't care about literals
  //   return;
  // }
  const newNode = buildTraceExpression(expressionPath, state, traceCfg);
  expressionPath.replaceWith(newNode);

  const replacePath = expressionPath.get('arguments.1');
  state.onCopy(expressionPath, replacePath);
  
  return replacePath;
}

export function traceWrapBindAndWrite(expressionPath, state, readTraceCfg, writeTraceConfig) {
  // if (t.isLiteral(node)) {
  //   // don't care about literals
  //   return;
  // }
  // const bindNode = buildTraceWrite(state, writeTraceCfg);
  const bindNode = buildTraceId(state, traceCfg);
  const expressionNode = buildTraceExpression(expressionPath, state, readTraceCfg, writeTraceConfig);

  // expressionPath.replaceWith(t.sequenceExpression([
  //   bindNode,
  //   expressionNode
  // ]));

  const replacePath = expressionPath.get('expressions.1');
  state.onCopy(expressionPath, replacePath);

  return replacePath;
}