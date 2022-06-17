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

  [TraceType.BranchPush]: tracePathStartBranch,
  [TraceType.BranchDecision]: tracePathStartBranch,
  [TraceType.BranchPop]: tracePathEndBranch,

  [TraceType.BeforeExpression]: traceBeforeExpression,

  [TraceType.Await]: tracePathEnd,
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

function tracePathStartBranch(path, state) {
  return tracePathStart(path, state, true);
}

function tracePathEndBranch(path, state) {
  return tracePathEnd(path, state, true);
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
    /**
     * @type {StaticTrace}
     */
    let staticTrace;

    const {
      type, syntax, dataNode, data,
      controlRole, controlId
    } = staticData;

    if (process.env.NODE_ENV === 'development') {
      // add some sanity checks for the contents of staticTraceData
      const allowedProps = [
        'type',
        'syntax',
        'dataNode',
        'data',
        'controlRole',
        'controlId'
      ];
      if (difference(Object.keys(staticData), allowedProps).length) {
        throw new Error(`Unknown key(s) in staticTraceData: ${JSON.stringify(staticData)}`);
      }
    }

    if (!type) {
      throw new Error(`invalid call to "addTrace" - missing "staticTraceData.type", in path: ${pathToString(path)}`);
    }
    if (traceCustomizationsByType[type]) {
      staticTrace = traceCustomizationsByType[type](path, state);
    }
    else {
      staticTrace = traceDefault(path, state);
    }

    // misc data
    staticTrace._traceId = _traceId;
    staticTrace._staticContextId = state.contexts.getCurrentStaticContextId(path);

    staticTrace.type = type;
    staticTrace.syntax = syntax;
    staticTrace.data = data;
    staticTrace.dataNode = dataNode;
    staticTrace.controlRole = controlRole;
    staticTrace.controlId = controlId;

    // push
    this._push(staticTrace);

    // path.setData('_traceId', _traceId);

    return _traceId;
  }

  updateStaticTrace(inProgramStaticTraceId, upd) {
    const staticTrace = this.getById(inProgramStaticTraceId);
    Object.assign(staticTrace, upd);
  }

  addPurpose(inProgramStaticTraceId, purpose) {
    const staticTrace = this.getById(inProgramStaticTraceId);
    staticTrace.purposes = staticTrace.purposes || [];
    if (purpose.constructor === Number) {
      purpose = {
        type: purpose
      };
    }
    staticTrace.purposes.push(purpose);
  }
}

export function getPathTraceId(path) {
  return path.getData('_traceId');
}
