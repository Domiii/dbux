// import * as t from '@babel/types';
import TraceCfg from '../definitions/TraceCfg';
import { getInstrumentPath, getReplacePath } from './builders/common';
import { buildTraceDeclarations, buildTraceExpression } from './builders/misc';
import { unshiftScopeBlock } from './scope';

// const keepStatementCfg = {
//   meta: {
//     keepStatement: true
//   }
// };

// /**
//  * @param {TraceCfg} traceCfg 
//  */
// function getDefaultBuild(traceCfg) {
//   return traceCfg.declarationTidIdentifier === undefined ? 
//     buildTraceExpression : 
//     buildtraceExpressionVar;
// }

export function traceWrapExpression(state, traceCfg) {
  const path = getInstrumentPath(traceCfg);
  const build = traceCfg.meta?.build || buildTraceExpression;// getDefaultBuild(traceCfg);
  const resultNode = build(state, traceCfg);

  // const s = pathToString(path);
  // const { type } = path.node;

  if (getReplacePath(traceCfg) !== false) {
    // we don't always want ad hoc replacement.
    // e.g. CalleeME straddles a more complicated relationship between CallExpression and ME
    path.replaceWith(resultNode);
  }
  // console.debug(`tWE`, type, s, '->', astNodeToString(resultNode));

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