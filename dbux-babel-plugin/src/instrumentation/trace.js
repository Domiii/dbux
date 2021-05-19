import * as t from '@babel/types';
import { buildTraceExpression, buildTraceWrite } from './builders/trace';

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

export function traceWrapWrite(expressionPath, state, writeTraceCfg, expressionTraceCfg) {
  // if (t.isLiteral(node)) {
  //   // don't care about literals
  //   return;
  // }
  const writeNode = buildTraceWrite(state, writeTraceCfg);
  const expressionNode = expressionTraceCfg ?
    buildTraceExpression(expressionPath, state, expressionTraceCfg) :
    expressionPath.node;

  expressionPath.replaceWith(t.sequenceExpression([
    writeNode,
    expressionNode
  ]));

  const replacePath = expressionPath.get('expressions.1');
  state.onCopy(expressionPath, replacePath);

  return replacePath;
}