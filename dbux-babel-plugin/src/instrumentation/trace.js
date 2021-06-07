// import * as t from '@babel/types';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { astNodeToString, pathToString } from '../helpers/pathHelpers';
import { UndefinedNode } from './builders/buildHelpers';
import { getInstrumentPath, getReplacePath } from './builders/common';
import { buildTraceExpression, buildTraceDeclarations, buildTraceId } from './builders/misc';
import { unshiftScopeBlock } from './scope';

// const keepStatementCfg = {
//   meta: {
//     keepStatement: true
//   }
// };

export function traceWrapExpression(state, traceCfg) {
  const path = getInstrumentPath(traceCfg);
  const build = traceCfg.meta?.build || buildTraceExpression;
  const resultNode = build(state, traceCfg);

  const s = pathToString(path);
  const { type } = path.node;

  if (getReplacePath(traceCfg) !== false) {
    // we don't always want ad hoc replacement.
    // e.g. CalleeME straddles a more complicated relationship between CallExpression and ME
    path.replaceWith(resultNode);
  }
  console.debug(`tWE`, type, s, '->', astNodeToString(resultNode));

  traceCfg.resultNode = resultNode;

  // NOTE: `onCopy` should not be necessary anymore, since nested paths should already have finished instrumentation
  // const replacePath = expressionPath.get('arguments.0');
  // state.onCopy(expressionPath, replacePath);

  // // return path of original expression node
  // return replacePath;
}

export function traceDeclarations(targetPath, state, traceCfgs) {
  const resultNodes = buildTraceDeclarations(state, traceCfgs);
  unshiftScopeBlock(targetPath, resultNodes)[0];
}
