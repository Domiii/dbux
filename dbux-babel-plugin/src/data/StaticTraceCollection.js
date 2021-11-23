import TraceType from '@dbux/common/src/types/constants/TraceType';
import * as t from '@babel/types';
import difference from 'lodash/difference';
import StaticCollection from './StaticCollection';

import { extractSourceStringWithoutComments } from '../helpers/sourceHelpers';
import { pathToString } from '../helpers/pathHelpers';
import { getNodeNames } from '../visitors/nameVisitors';


// ###########################################################################
// trace state management utilities
// ###########################################################################

/**
 * Build `loc` based on `TraceType`.
 */
const traceCustomizationsByType = {
  [TraceType.PushImmediate]: tracePathStartContext,
  [TraceType.PopImmediate]: tracePathEndContext,

  // NOTE: PushCallback + PopCallback are sharing the StaticTrace of `CallbackArgument` which pegs on `CallArgument` (so they won't pass through here)
  // [TraceType.PushCallback]: tracePathStart,
  // [TraceType.PopCallback]: tracePathEnd,
  [TraceType.BeforeExpression]: traceBeforeExpression,

  [TraceType.Await]: tracePathEnd,
  // [TraceType.Resume]: tracePathEnd,
  [TraceType.BlockStart]: tracePathStart,
  [TraceType.BlockEnd]: tracePathEnd,
  [TraceType.EndOfContext]: tracePathEndContext,
  [TraceType.Catch]: tracePathStart,
  [TraceType.Finally]: tracePathStart,
  [TraceType.TryExit]: tracePathEnd,
  [TraceType.FinallyExit]: tracePathEnd,
};


function tracePathStart(path, state, thin) {
  const { node } = path;
  const { loc: { start } } = node;
  const end = { ...start };
  if (!thin) {
    // for blocks, move *into* the block (curly braces)
    if (t.isBlock(node)) {
      end.column += 1;
    }
  }

  return {
    loc: {
      start,
      end
    }
  };
}

function tracePathEnd(path, state, thin) {
  const { node } = path;
  const { loc: { end } } = node;
  const start = { ...end };
  if (!thin) {
    // for blocks, move *into* the block (curly braces)
    if (t.isBlock(node) && start.column > 0) {
      start.column -= 1;
    }
  }

  return {
    loc: {
      start,
      end
    }
  };
}

function tracePathStartContext(path, state) {
  const thin = path.isProgram();
  return tracePathStart(path, state, thin);
}

function tracePathEndContext(path, state) {
  const thin = path.isProgram();
  return tracePathEnd(path, state, thin);
}

function tracePathEndThin(path, state) {
  return tracePathEnd(path, state, true);
}

function getTraceDisplayName(path, state) {
  let displayName;
  if (path.isFunction()) {
    displayName = getNodeNames(path.node)?.displayName;
    // displayName = getFunctionDisplayName(path, state);
  }
  else {
    const str = extractSourceStringWithoutComments(path.node, state);
    displayName = str;
    // displayName = pathToString(str);
  }
  return displayName;
}

function traceBeforeExpression(path, state) {
  return {
    ...tracePathStart(path, state),
    displayName: getTraceDisplayName(path, state)
  };
}

function traceDefault(path, state) {
  // const parentStaticId = state.contexts.getParentStaticContextId(path);

  let displayName = getTraceDisplayName(path, state);
  // const displayName = '';

  const { loc } = path.node;
  return {
    displayName,
    // _parentId: parentStaticId,
    loc
  };
}

// ###########################################################################
// StaticTraceCollection
// ###########################################################################

export default class StaticTraceCollection extends StaticCollection {
  getTraceOfPath(path) {
    const traceId = getPathTraceId(path);
    return traceId && this.getById(traceId) || null;
  }


  /**
   * Tracing a path in its entirety
   * (usually means, the trace is recorded right before the given path).
   */
  addTrace(path, staticData) {
    this.checkPath(path);

    const { state } = this;

    // console.log('TRACE', '@', `${state.filename}:${line}`);
    // get `displayName`, `loc`
    const _traceId = this._getNextId();
    let trace;

    const { type, dataNode, data } = staticData;

    if (process.env.NODE_ENV === 'development') {
      // add some sanity checks for the contents of staticTraceData
      if (difference(Object.keys(staticData), ['type', 'dataNode', 'data']).length) {
        throw new Error(`Unknown key(s) in staticTraceData: ${JSON.stringify(staticData)}`);
      }
    }

    if (!type) {
      throw new Error(`invalid call to "addTrace" - missing "staticData.type", in path: ${pathToString(path)}`);
    }
    if (traceCustomizationsByType[type]) {
      trace = traceCustomizationsByType[type](path, state);
    }
    else {
      trace = traceDefault(path, state);
    }

    // misc data
    trace._traceId = _traceId;
    trace._staticContextId = state.contexts.getCurrentStaticContextId(path);
    trace.type = type;
    trace.data = data;
    trace.dataNode = dataNode;

    // push
    this._push(trace);

    // path.setData('_traceId', _traceId);

    return _traceId;
  }
}

export function getPathTraceId(path) {
  return path.getData('_traceId');
}
