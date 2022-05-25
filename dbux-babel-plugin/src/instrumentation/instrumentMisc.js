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
 * Insert trace call at beginning of `targetPath`'s body.
 */
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

/**
 * Insert trace call behind `targetPath`.
 */
export function insertAfterBody(state, traceCfg) {
  let path = getInstrumentPath(traceCfg);

  // const s = pathToString(path);
  // const { type } = path.node;

  const resultNode = doBuild(state, traceCfg);

  // hackfix: babel seems to force us to handle array and non-array separately
  const bodyPath = path.get('body');
  if (bodyPath.node) {
    // array?
    bodyPath.insertAfter(resultNode);
  }
  else {
    // non-array?
    path.pushContainer('body', resultNode);
  }
  // console.debug(`tWE`, type, s, '->', astNodeToString(resultNode));

  postInstrument(traceCfg, resultNode);
}

/**
 * Insert trace call before instrument path.
 */
export function insertBeforeNode(state, traceCfg) {
  let path = getInstrumentPath(traceCfg);

  const resultNode = doBuild(state, traceCfg);

  path.insertBefore(resultNode);

  postInstrument(traceCfg, resultNode);
}

/**
 * Insert trace call behind instrument path.
 */
export function insertAfterNode(state, traceCfg) {
  let path = getInstrumentPath(traceCfg);

  const resultNode = doBuild(state, traceCfg);

  path.insertAfter(resultNode);

  postInstrument(traceCfg, resultNode);
}

export function postInstrument(traceCfg, resultNode) {
  traceCfg.resultNode = resultNode;
}

export function instrumentHoisted(targetPath, state, traceCfgs) {
  const resultNodes = buildAll(state, traceCfgs, buildTraceDeclarationVar);
  unshiftScopeBlock(targetPath, resultNodes)[0];
}
