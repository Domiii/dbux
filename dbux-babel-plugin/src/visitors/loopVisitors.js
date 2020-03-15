import * as t from '@babel/types';
import LoopType from 'dbux-common/src/core/constants/LoopType';
import { EmptyObject } from 'dbux-common/src/util/EmptyObject';
import { logInternalError } from '../log/logger';
import { extractSourceStringWithoutCommentsAtLoc } from '../helpers/sourceHelpers';
import { callDbuxMethod } from '../helpers/callHelpers';
import { addStaticVars } from '../helpers/varHelpers';

// ###########################################################################
// Loop types
// ###########################################################################

const loopTypesByNodeTypeName = {
  ForStatement: LoopType.For,
  ForInStatement: LoopType.ForIn,
  ForOfStatement: LoopType.ForOf,
  WhileStatement: LoopType.While,
  DoWhileStatement: LoopType.DoWhile
};

function getLoopType(isForAwaitOf, nodeTypeName) {
  if (isForAwaitOf) {
    return LoopType.ForAwaitOf;
  }

  const loopType = loopTypesByNodeTypeName[nodeTypeName];
  if (!loopType) {
    logInternalError('unrecognized loop node type name:', nodeTypeName);
  }
  return loopType;
}


// ###########################################################################
// helpers
// ###########################################################################

function getLoopHeadLoc(path, bodyPath) {
  bodyPath = Array.isArray(bodyPath) ? bodyPath[0] : bodyPath;
  const bodyLoc = bodyPath?.node.loc || path.node.loc;

  const { start } = path.node.loc;
  const end = bodyLoc.start;
  return {
    start,
    end
  };
}

/**
 * Get string representation of loop head.
 */
function getLoopDisplayName(state, loopHeadLoc, loopType) {
  const displayName = (extractSourceStringWithoutCommentsAtLoc(loopHeadLoc, state) || `${LoopType.nameFrom(loopType)}-loop`).trim();
  return displayName;
}

function addLoopStaticVars(path, state, loopId, loopHeadLoc) {
  // TODO
  // return addStaticVars();
}

// ###########################################################################
// actual instrumentation
// ###########################################################################

/**
 * Instrumentation of `for-await-of` loops:
 * 
 * `for await (const left of dbux.wrapAsyncIterator(right)) { ... }`
 */
function instrumentForAwaitOfLoop(path, state) {
  // TODO: instrument this

  // `for await (const left of dbux.wrapAsyncIterator(right)) { ... }`
}


export function instrumentLoopBodyDefault(bodyPath, state, staticVars) {
  //t.expressionStatement(
  // TODO: figure out how to store loop vars
  const varRegisterCall = callDbuxMethod(state, 'pushLoop',
    loopId,
    staticVars.map(
      staticVar => ([
        t.numericLiteral(staticVar._staticId),
        t.identifier(staticVar.name)
      ])
    )
  );


  // TODO: push + pop Loops; then add LoopIterations

}


// ###########################################################################
// core
// ###########################################################################

export function instrumentLoop(path, state) {
  // const bodyPath = path.get('body');

  // const isForAwaitOf = path.isForOfStatement() && path.node.await;
  // const loopType = getLoopType(isForAwaitOf, path.node.type);
  // const loopHeadLoc = getLoopHeadLoc(path, bodyPath);
  // const displayName = getLoopDisplayName(state, loopHeadLoc, loopType);

  // // add loop
  // const staticLoopId = state.addLoop(path, loopType, loopHeadLoc, displayName);

  // // add loop vars
  // addLoopStaticVars(path, state, staticLoopId, loopHeadLoc);

  // // TODO: wrap entire loop in try/finally and push/pop loop

  // if (isForAwaitOf) {
  //   instrumentForAwaitOfLoop(path, state);
  // }
  // else {
  //   instrumentLoopBodyDefault(bodyPath, state, staticVars);
  // }
}