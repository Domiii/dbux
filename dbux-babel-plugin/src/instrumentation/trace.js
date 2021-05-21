// import * as t from '@babel/types';
import { buildTraceExpression, buildTraceId, buildTraceWrite, UndefinedNode } from './builders/trace';
import { unshiftScopeBlock } from './scope';

const keepStatementCfg = {
  meta: {
    keepStatement: true
  }
};

export function traceWrapExpression(expressionPath, state, traceCfg) {
  const newNode = buildTraceExpression(expressionPath.node, state, traceCfg);
  expressionPath.replaceWith(newNode);

  const replacePath = expressionPath.get('arguments.1');
  state.onCopy(expressionPath, replacePath);

  // return path of original expression node
  return replacePath;
}

export function unshiftScopeTrace(targetPath, state, traceCfg) {
  const newNode = buildTraceId(state, traceCfg, keepStatementCfg);
  return unshiftScopeBlock(targetPath, newNode)[0];
}

/**
 * Input: `c = a + b`
 * Output: `c = tb(te(...a+b..., %tid1%, %bindingId1%, %inputs1%), %tid2%, [tid1])`
 * 
 * Input: `var x;
 * Output: `var x = tb(undefined, %tid2%, [])`
 */
export function traceWrapWrite(path, state, writeTraceCfg) {
  let expressionNode = path.node || UndefinedNode;
  // expressionNode = buildTraceExpression(path.node, state, readTraceCfg);

  const bindNode = buildTraceWrite(expressionNode, state, writeTraceCfg);
  path.replaceWith(bindNode);

  // expressionPath.replaceWith(t.sequenceExpression([
  //   bindNode,
  //   expressionNode
  // ]));

  let replacePath;
  // if (readTraceCfg) {
  //   replacePath = path.get('arguments.0.arguments.0');
  // }
  // else {
  replacePath = path.get('arguments.0');
  // }
  state.onCopy(path, replacePath);

  // return path of original expression node
  return replacePath;
}