// import * as t from '@babel/types';
import { pathToString, pathToStringAnnotated } from 'src/helpers/pathHelpers';
import { applyPreconditionToExpression, getInstrumentPath, getReplacePath } from './builders/common';
import { buildDefault, buildTraceDeclarations, buildTraceExpression } from './builders/misc';
import { unshiftScopeBlock } from './scope';

export function instrumentExpression(state, traceCfg) {
  const path = getInstrumentPath(traceCfg);
  const resultNode = buildDefault(state, traceCfg);

  if (getReplacePath(traceCfg) !== false) {
    // we don't always want ad hoc replacement.
    // e.g. CalleeME straddles a more complicated relationship between CallExpression and ME
    path.replaceWith(resultNode);
  }

  postInstrument(traceCfg, resultNode);
}

/**
 * Insert trace call behind `targetPath`
 */
export function instrumentBehind(state, traceCfg) {
  const path = getInstrumentPath(traceCfg);
  const resultNode = buildDefault(state, traceCfg);

  // const s = pathToString(path);
  // const { type } = path.node;

  path.insertAfter(resultNode);
  // console.debug(`tWE`, type, s, '->', astNodeToString(resultNode));

  postInstrument(traceCfg, resultNode);
}

export function instrumentUnshiftBody(state, traceCfg) {
  // const path = getInstrumentPath(traceCfg);
  const { path } = traceCfg;
  const resultNode = buildDefault(state, traceCfg);

  // const s = pathToString(path);
  // const { type } = path.node;

  console.debug(`instrumentUnshitBody`, pathToStringAnnotated(path));
  path.unshiftContainer('body', resultNode);

  postInstrument(traceCfg, resultNode);
}

export function postInstrument(traceCfg, resultNode) {
  traceCfg.resultNode = resultNode;
}

export function traceDeclarations(targetPath, state, traceCfgs) {
  const resultNodes = buildTraceDeclarations(state, traceCfgs);
  unshiftScopeBlock(targetPath, resultNodes)[0];
}
