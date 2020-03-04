import * as t from '@babel/types';
import LoopType from 'dbux-common/src/core/constants/LoopType';
import { logInternalError } from '../log/logger';
import { extractSourceStringWithoutCommentsAtLoc } from '../helpers/sourceHelpers';

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
// actual instrumentation
// ###########################################################################

function instrumentForAwaitOfLoop(path, state) {
  // TODO: for-await-of is not handled yet. Specifically:
  //  1. `node.right` is a `Symbol.asyncIterator`. We want to wrap that.
  //  2. when `next()` generates a new value, `preAwait`, and
  //  3. in `path.body`: start with a `postAwait`
}


// ###########################################################################
// helpers
// ###########################################################################

function getLoopHeadLoc(path, bodyPath) {
  bodyPath = Array.isArray(bodyPath) ? bodyPath[0] : bodyPath;
  const bodyLoc = bodyPath?.loc;
  if (!bodyLoc) {
    return path.loc;
  }

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
function getLoopDisplayName(loopHeadLoc, state) {
  const displayName = (extractSourceStringWithoutCommentsAtLoc(loopHeadLoc, state) || `${LoopType.nameFrom(loopType)}-loop`).trim();
  return displayName;
}

function getLoopStaticVars(path, state) {
  const bindings = path.scope?.bindings;

  // TODO
  return [];
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
  const vars = getLoopStaticVars(path, state);

  const loopId = state.addLoop(path, loopType, loopHeadLoc, displayName, vars);

  // TODO: wrap entire loop in try/finally and push/pop loop

  if (isForAwaitOf) {
    instrumentForAwaitOfLoop(path, state);
  }
  else {
    instrumentLoopBody(bodyPath, state, vars);
  }
}


export function instrumentLoopBody(bodyPath, state, staticVars) {
  const varsArrayNode = t.arrayExpression(staticVars.map(staticVar => t.identifier(staticVar.name)));
  // TODO: on body start, add a new LoopIteration; capture all variables as well
}