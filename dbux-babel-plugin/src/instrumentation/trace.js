// import * as t from '@babel/types';
import { buildTraceExpression, buildTraceDeclaration, UndefinedNode, buildTraceDeclarations, buildTraceId } from './builders/misc';
import { unshiftScopeBlock } from './scope';

const keepStatementCfg = {
  meta: {
    keepStatement: true
  }
};

export function traceWrapExpression(expressionPath, state, traceCfg) {
  const expressionNode = expressionPath.node || UndefinedNode;
  const build = traceCfg.meta?.build || buildTraceExpression;
  const newNode = build(expressionNode, state, traceCfg);
  expressionPath.replaceWith(newNode);

  const replacePath = expressionPath.get('arguments.0');
  state.onCopy(expressionPath, replacePath);

  // return path of original expression node
  return replacePath;
}

export function traceNoValue(path, state, traceCfg) {
  const expressionNode = path.node || UndefinedNode;
  const build = traceCfg.meta?.build || buildTraceId;
  const newNode = build(expressionNode, state, traceCfg);
  path.replaceWith(newNode);
  return path;
}

export function traceDeclarations(targetPath, state, traceCfgs) {
  const newNodes = buildTraceDeclarations(state, traceCfgs);
  unshiftScopeBlock(targetPath, newNodes)[0];
}
