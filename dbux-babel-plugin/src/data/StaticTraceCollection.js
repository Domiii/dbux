import TraceType from 'dbux-common/src/core/constants/TraceType';
import * as t from '@babel/types';
import StaticCollection from './StaticCollection';

import { extractSourceStringWithoutComments } from '../helpers/sourceHelpers';
import { getPresentableString } from '../helpers/misc';
import { getFunctionDisplayName } from '../helpers/functionHelpers';


// ###########################################################################
// trace state management utilities
// ###########################################################################

const traceCustomizationsByType = {
  [TraceType.PushImmediate]: tracePathStart,
  [TraceType.PopImmediate]: tracePathEnd,

  // NOTE: PushCallback + PopCallback are sharing the StaticTrace of `CallbackArgument` which pegs on `CallArgument` (so they won't pass through here)
  // [TraceType.PushCallback]: tracePathStart,
  // [TraceType.PopCallback]: tracePathEnd,
  [TraceType.BeforeExpression]: traceBeforeExpression,

  [TraceType.Await]: tracePathEnd,
  // [TraceType.Resume]: tracePathEnd,
  [TraceType.BlockStart]: tracePathStart,
  [TraceType.BlockEnd]: tracePathEnd,
  [TraceType.EndOfContext]: tracePathEnd
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

function getTraceDisplayName(path, state) {
  let displayName;
  if (path.isFunction()) {
    displayName = getFunctionDisplayName(path, state);
  }
  else {
    const str = extractSourceStringWithoutComments(path.node, state);
    displayName = getPresentableString(str);
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
  addTrace(path, type, customArg, cfg) {
    this.checkPath(path);

    const { state } = this;

    // console.log('TRACE', '@', `${state.filename}:${line}`);
    // per-type data
    const _traceId = this._getNextId();
    let trace;
    if (traceCustomizationsByType[type]) {
      trace = traceCustomizationsByType[type](path, state, customArg);
    }
    else {
      trace = traceDefault(path, state, customArg);
    }

    // context-sensitive data
    trace._callId = cfg?.callId || type === TraceType.BeforeCallExpression && _traceId;
    trace._resultCallId = cfg?.resultCallId;

    // misc data
    trace._traceId = _traceId;
    trace._staticContextId = state.contexts.getCurrentStaticContextId(path);
    trace.type = type;

    // push
    this._push(trace);

    path.setData('_traceId', _traceId);

    return _traceId;
  }
}

export function getPathTraceId(path) {
  return path.getData('_traceId');
}
