import StaticContextType from 'dbux-common/src/core/constants/StaticContextType';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { getBasename } from 'dbux-common/src/util/pathUtil';
import * as t from '@babel/types';

import { getPresentableString } from './helpers/misc';
import { getFunctionDisplayName } from './helpers/functionHelpers';
import { extractSourceStringWithoutComments } from './helpers/sourceHelpers';

function checkPath(path) {
  if (!path.node.loc) {
    const msg = 'trying to instrument an already instrumented node: ' + path;
    throw new Error(msg);
  }
}

// ###########################################################################
// trace stuff
// ###########################################################################

const traceCustomizationsByType = {
  [TraceType.PushImmediate]: tracePathStart,
  [TraceType.PopImmediate]: tracePathEnd,

  // NOTE: PushCallback + PopCallback are sharing the StaticTrace of `CallbackArgument` which pegs on `CallArgument` (so they won't pass through here)
  // [TraceType.PushCallback]: tracePathStart,
  // [TraceType.PopCallback]: tracePathEnd,
  [TraceType.BeforeExpression]: traceBeforeExpression,

  [TraceType.Await]: tracePathEnd,
  [TraceType.Resume]: tracePathEnd,
  [TraceType.BlockStart]: tracePathStart,
  [TraceType.BlockEnd]: tracePathEnd
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
    if (t.isBlock(node)) {
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
    displayName = getPresentableString(str, 30);
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
  // const parentStaticId = state.getParentStaticContextId(path);

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
// Build custom dbux state object
// ###########################################################################

/**
 * Build the state used by dbux-babel-plugin throughout the entire AST visit.
 */
export default function injectDbuxState(programPath, programState) {
  const filePath = programState.filename;
  const fileName = filePath && getBasename(filePath)

  const { scope } = programPath;
  const { file: programFile } = programState;

  const staticContexts = [null]; // staticId = 0 is always null
  const traces = [null];

  const dbuxState = {
    // static program data
    programFile,
    filePath,
    fileName,

    staticContexts,
    traces,
    ids: {
      dbuxInit: scope.generateUid('dbux_init'),
      dbuxRuntime: scope.generateUid('dbuxRuntime'),
      dbux: scope.generateUid('dbux')
    },
    // console.log('[Program]', state.filename);

    getTrace(_traceId) {
      return traces[_traceId];
    },

    onTrace(path) {
      return dbuxState.onEnter(path, 'trace');
    },

    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onEnter(path, purpose) {
      const key = 'enter_' + purpose;
      if (path.getData(key)) {
        return false;
      }
      // if (entered.has(path)) {
      //   return false;
      // }
      if (!path.node?.loc) {
        // this node has been dynamically emitted; not part of the original source code -> not interested in it
        return false;
      }

      // remember our visit
      dbuxState.markEntered(path, purpose);

      return true;
    },

    markEntered(path, purpose) {
      if (!purpose) {
        throw new Error('Could not mark path because no purpose was given:\n' + path.toString());
      }
      const key = 'enter_' + purpose;
      // entered.add(path);
      path.setData(key, true);
    },

    markExited(path, purpose) {
      const key = 'enter_' + purpose;
      path.setData(key, true);
    },

    markVisited(path, purpose) {
      // TODO: when something is instrumented for multiple purposes (e.g. purposes A and B):
      //  1. A creates a copy of the node (and thus will not be visited by A again)
      //  2. then B creates a copy of the node (and thus will not be visited by B again)
      //  3. since B created another copy of the node and that is marked as visited by A
      dbuxState.markEntered(path, purpose);
      // dbuxState.markExited(path); // not necessary for now
    },

    /**
     * Problem: If paths are wrapped using `@babel/template`, only their nodes get copied, thus all associated `data` in path is lost.
     * This method keeps track of that.
     * It also marks it as visited by purpose (if purpose is given), to prevent infinitely revisiting the same path.
     */
    onCopy(oldPath, newPath, purpose = null) {
      newPath.data = oldPath.data;
      purpose && this.markVisited(newPath, purpose);
    },

    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onExit(path) {
      if (path.getData('_dbux_exited')) {
        return false;
      }
      path.setData('_dbux_exited', true);
      return true;
    },

    getClosestAncestorData(path, dataName) {
      const staticContextParent = path.findParent(p => !!p.getData(dataName));
      return staticContextParent?.getData(dataName);
    },

    getParentStaticContextId(path) {
      return programState.getClosestAncestorData(path, 'staticId');
    },

    getCurrentStaticContextId(path) {
      return path.getData('staticId') || programState.getClosestAncestorData(path, 'staticId');
    },

    getClosestContextIdName(path) {
      return programState.getClosestAncestorData(path, 'contextIdName');
    },

    /**
     * Generate a new variable identifier to store `contextId` for given path.
     * NOTE: This does NOT generate the contextId itself, nor put it anywhere into the program.
     */
    genContextIdName(path) {
      const contextId = path.scope.generateUid('contextId');
      path.setData('contextIdName', contextId);
      return contextId;
    },

    getStaticContext(staticId) {
      return staticContexts[staticId];
    },

    /**
     * Contexts are (currently) potential stackframes; that is `Program` and `Function` nodes.
     */
    addStaticContext(path, data) {
      checkPath(path);

      // console.log('STATIC', path.get('id')?.name, '@', `${state.filename}:${line}`);
      const _staticId = staticContexts.length;
      const _parentId = dbuxState.getParentStaticContextId(path);
      // console.log('actualParent',  toSourceString(actualParent.node));
      const { loc } = path.node;
      staticContexts.push({
        _staticId,
        _parentId,
        loc,
        ...data
      });

      path.setData('staticId', _staticId);
      return _staticId;
    },

    addResumeContext(bodyOrAwaitPath, locStart) {
      checkPath(bodyOrAwaitPath);

      const _parentId = dbuxState.getCurrentStaticContextId(bodyOrAwaitPath);
      const bodyParent = staticContexts[_parentId];
      const { end } = bodyParent.loc;     // we don't know where it ends yet (can only be determined at run-time)
      const loc = {
        start: locStart,
        end
      };

      const _staticId = staticContexts.length;
      staticContexts.push({
        type: StaticContextType.Resume,
        _staticId,
        _parentId,
        // displayName: parent.displayName,
        loc
      });
      return _staticId;
    },

    /**
     * Tracing a path in its entirety (usually means, the trace is recorded right before the given path).
     */
    addTrace(path, type, customArg, cfg) {
      checkPath(path);

      // console.log('TRACE', '@', `${state.filename}:${line}`);
      // per-type data
      const _traceId = traces.length;
      let trace;
      if (traceCustomizationsByType[type]) {
        trace = traceCustomizationsByType[type](path, dbuxState, customArg);
      }
      else {
        trace = traceDefault(path, dbuxState, customArg);
      }

      // context-sensitive data
      trace._calleeId = cfg?.calleeId;

      // misc data
      trace._traceId = _traceId;
      trace._staticContextId = dbuxState.getCurrentStaticContextId(path);
      trace.type = type;

      // push
      traces.push(trace);

      path.setData('_traceId', _traceId);

      return _traceId;
    },
  };

  Object.assign(programState, dbuxState);

  return programState;
}