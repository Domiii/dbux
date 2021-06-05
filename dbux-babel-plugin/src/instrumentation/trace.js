// import * as t from '@babel/types';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { UndefinedNode } from './builders/buildHelpers';
import { buildTraceExpression, buildTraceDeclarations, buildTraceId } from './builders/misc';
import { unshiftScopeBlock } from './scope';

const keepStatementCfg = {
  meta: {
    keepStatement: true
  }
};


function getInstrumentPath(traceCfg) {
  const {
    path: tracePath,
    meta: {
      replacePath
    } = EmptyObject
  } = traceCfg;
  return replacePath || tracePath;
}

export function traceWrapExpression(state, traceCfg) {
  const { path } = getInstrumentPath(traceCfg);
  const expressionNode = path.node || UndefinedNode;
  const build = traceCfg.meta?.build || buildTraceExpression;
  const newNode = build(expressionNode, state, traceCfg);
  
  // TODO: only replace if `replacePath !== false`?

  path.replaceWith(newNode);

  // NOTE: `onCopy` should not be necessary anymore, since nested paths should already have finished instrumentation
  // const replacePath = expressionPath.get('arguments.0');
  // state.onCopy(expressionPath, replacePath);

  // // return path of original expression node
  // return replacePath;
}

export function traceDeclarations(targetPath, state, traceCfgs) {
  const newNodes = buildTraceDeclarations(state, traceCfgs);
  unshiftScopeBlock(targetPath, newNodes)[0];
}
