// import * as t from '@babel/types';
import { applyPreconditionToExpression, getInstrumentPath, getReplacePath } from './builders/common';
import { buildTraceDeclarations, buildTraceExpression } from './builders/misc';
import { unshiftScopeBlock } from './scope';

export function traceWrapExpression(state, traceCfg) {
  const path = getInstrumentPath(traceCfg);
  const build = traceCfg.meta?.build || buildTraceExpression;// getDefaultBuild(traceCfg);
  
  let resultNode = build(state, traceCfg);
  resultNode = applyPreconditionToExpression(traceCfg, resultNode);

  if (getReplacePath(traceCfg) !== false) {
    // we don't always want ad hoc replacement.
    // e.g. CalleeME straddles a more complicated relationship between CallExpression and ME
    path.replaceWith(resultNode);
  }
  // console.debug(`tWE`, type, s, '->', astNodeToString(resultNode));

  traceCfg.resultNode = resultNode;

  // NOTE: `onCopy` should not be necessary anymore, since nested paths should already have finished instrumentation
  // const targetPath = expressionPath.get('arguments.0');
  // state.onCopy(expressionPath, targetPath);

  // // return path of original expression node
  // return targetPath;
}

/**
 * Insert trace call behind `targetPath`
 */
export function traceBehind(state, traceCfg) {
  const path = getInstrumentPath(traceCfg);
  const build = traceCfg.meta?.build || buildTraceExpression;// getDefaultBuild(traceCfg);
  
  let resultNode = build(state, traceCfg);
  resultNode = applyPreconditionToExpression(traceCfg, resultNode);

  // const s = pathToString(path);
  // const { type } = path.node;

  path.insertAfter(resultNode);
  // console.debug(`tWE`, type, s, '->', astNodeToString(resultNode));

  traceCfg.resultNode = resultNode;

  // NOTE: `onCopy` should not be necessary anymore, since nested paths should already have finished instrumentation
  // const targetPath = expressionPath.get('arguments.0');
  // state.onCopy(expressionPath, targetPath);

  // // return path of original expression node
  // return targetPath;
}

export function traceDeclarations(targetPath, state, traceCfgs) {
  const resultNodes = buildTraceDeclarations(state, traceCfgs);
  unshiftScopeBlock(targetPath, resultNodes)[0];
}