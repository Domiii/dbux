import * as t from '@babel/types';
import LoopType from 'dbux-common/src/core/constants/LoopType';
import { logInternalError } from '../log/logger';
import { extractSourceStringWithoutCommentsAtLoc } from '../helpers/sourceHelpers';
import { callDbuxMethod } from '../helpers/callHelpers';
import { EmptyArray } from '../../../dbux-common/src/util/arrayUtil';

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

function isInLoc(inner, outer) {

}

function getClosestScopedPath(path) {
  if (path.node.body) {
    path = path.get('body');
  }

  let current = path;
  do {
    if (current.scope) {
      return current;
    }
    current = path.parentPath;
  }
  while (current);

  return null;
}

/**
 * Get string representation of loop head.
 */
function getLoopDisplayName(loopHeadLoc, state) {
  const displayName = (extractSourceStringWithoutCommentsAtLoc(loopHeadLoc, state) || `${LoopType.nameFrom(loopType)}-loop`).trim();
  return displayName;
}

function addLoopStaticVars(path, state, loopId, loopHeadLoc) {
  const scopedPath = getClosestScopedPath(path);
  const bindings = scopedPath?.scope?.bindings || EmptyArray;

  // see: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings
  for (const binding of bindings) {
    const {
      referencePaths,
      identifier,
      constantViolations
    } = binding;

    for (const varPath of referencePaths) {
      const { loc } = varPath;
      if (isInLoc(loc, loopHeadLoc)) {
        // add var access
        const isWrite = !constantViolations.includes(varPath);
        state.loopVars.addVarRef(varPath, identifier.name, isWrite, loopId);
      }
    }
  }
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
  const varRegisterCall = callDbuxMethod(state, 'setLoopVars',
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
  const bodyPath = path.get('body');

  const isForAwaitOf = path.isForOfStatement() && path.node.await;
  const loopType = getLoopType(isForAwaitOf, path.node.type);
  const loopHeadLoc = getLoopHeadLoc(path, bodyPath);
  const displayName = getLoopDisplayName(loopHeadLoc, state);

  // add loop
  const loopId = state.addLoop(path, loopType, loopHeadLoc, displayName);

  // add loop vars
  addLoopStaticVars(path, state, loopId, loopHeadLoc);

  // TODO: wrap entire loop in try/finally and push/pop loop

  if (isForAwaitOf) {
    instrumentForAwaitOfLoop(path, state);
  }
  else {
    instrumentLoopBodyDefault(bodyPath, state, staticVars);
  }
}