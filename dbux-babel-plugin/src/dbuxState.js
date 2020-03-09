import StaticContextType from 'dbux-common/src/core/constants/StaticContextType';
import { getBasename } from 'dbux-common/src/util/pathUtil';

import { getPathTraceId } from './helpers/instrumentationHelper';
import StaticLoopCollection from './data/StaticLoopCollection';
import StaticTraceCollection from './data/StaticTraceCollection';
import StaticLoopVarRefCollection from './data/StaticLoopVarRefCollection';


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
  const traces = new StaticTraceCollection(this);
  const loops = new StaticLoopCollection(this);
  const loopVars = new StaticLoopVarRefCollection(this);

  const dbuxState = {
    // static program data
    programFile,
    filePath,
    fileName,

    staticContexts,
    traces,
    loops,
    loopVars,

    ids: {
      dbuxInit: scope.generateUid('dbux_init'),
      dbuxRuntime: scope.generateUid('dbuxRuntime'),
      dbux: scope.generateUid('dbux')
    },
    // console.log('[Program]', state.filename);

    // ###########################################################################
    // getters
    // ###########################################################################

    getTraceOfPath(path) {
      const traceId = getPathTraceId(path);
      return traceId && this.getTrace(traceId) || null;
    },

    getTrace(traceId) {
      return traces[traceId];
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

    getStaticContext(staticId) {
      return staticContexts[staticId];
    },

    
    // ###########################################################################
    // visitor check-ins
    // ###########################################################################

    onTrace(path) {
      return dbuxState.onEnter(path, 'trace');
    },

    onTraceExit(path) {
      return dbuxState.onExit(path, 'trace');
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

    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onExit(path, purpose) {
      const key = 'exit_' + purpose;
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
      dbuxState.markExited(path, purpose);

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
      if (!purpose) {
        throw new Error('Could not mark path because no purpose was given:\n' + path.toString());
      }
      const key = 'exit_' + purpose;
      // entered.add(path);
      path.setData(key, true);
    },

    markVisited(path, purpose) {
      // WARNING: when something is instrumented for multiple purposes (e.g. purposes A and B):
      //  1. A creates a copy of the node (and thus will not be visited by A again)
      //  2. then B creates a copy of the node (and thus will not be visited by B again)
      //  3. since B created another copy of the node and that is marked as visited by A
      dbuxState.markEntered(path, purpose);
      // dbuxState.markExited(path); // not necessary for now
    },

    // ###########################################################################
    // utilities
    // ###########################################################################

    /**
     * Problem: If paths are wrapped using `@babel/template`, only their nodes get copied, thus all associated `data` in path is lost.
     * This method keeps track of that.
     * It also marks it as visited by purpose (if purpose is given), to prevent infinitely revisiting the same path.
     */
    onCopy(oldPath, newPath, purpose = null) {
      newPath.data = oldPath.data;
      purpose && this.markVisited(newPath, purpose);
    },

    // ###########################################################################
    // add contexts
    // ###########################################################################

    /**
     * Generate a new variable identifier to store `contextId` for given path.
     * NOTE: This does NOT generate the contextId itself, nor put it anywhere into the program.
     */
    genContextIdName(path) {
      const contextId = path.scope.generateUid('contextId');
      // path.setData('contextIdName', contextId);
      return contextId;
    },

    /**
     * Contexts are (mostly) potential stackframes; that is `Program` and `Function` nodes.
     * 
     * TODO: move this legacy code (use StaticCollection instead)
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
    }
  };

  Object.assign(programState, dbuxState);

  return programState;
}