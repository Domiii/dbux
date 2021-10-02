// import * as t from '@babel/types';
// import { pathToString, pathToStringAnnotated } from 'src/helpers/pathHelpers';
import { getInstrumentPath, getBuildTargetPath } from './builders/common';
import { doBuild, buildAll, buildTraceDeclarationVar } from './builders/misc';
import { unshiftScopeBlock } from './scope';

export function instrumentExpression(state, traceCfg) {
  const path = getInstrumentPath(traceCfg);
  const resultNode = doBuild(state, traceCfg);

  if (getBuildTargetPath(traceCfg) !== false) {
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
  const resultNode = doBuild(state, traceCfg);

  // const s = pathToString(path);
  // const { type } = path.node;

  path.insertAfter(resultNode);
  // console.debug(`tWE`, type, s, '->', astNodeToString(resultNode));

  postInstrument(traceCfg, resultNode);
}

export function instrumentUnshiftBody(state, traceCfg) {
  // const path = getInstrumentPath(traceCfg);
  const { path } = traceCfg;
  const resultNode = doBuild(state, traceCfg);

  // const s = pathToString(path);
  // const { type } = path.node;

  // console.debug(`instrumentUnshitBody`, pathToStringAnnotated(path));
  path.unshiftContainer('body', resultNode);

  postInstrument(traceCfg, resultNode);
}

export function postInstrument(traceCfg, resultNode) {
  traceCfg.resultNode = resultNode;
}

export function instrumentHoisted(targetPath, state, traceCfgs) {
  const resultNodes = buildAll(state, traceCfgs, buildTraceDeclarationVar);
  unshiftScopeBlock(targetPath, resultNodes)[0];
}
