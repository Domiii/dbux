import { pathGetBasename } from '@dbux/common/src/util/pathUtil';

import StaticContextCollection from './data/StaticContextCollection';
import StaticTraceCollection from './data/StaticTraceCollection';
import StaticLoopCollection from './data/StaticLoopCollection';
import StaticVarAccessCollection from './data/StaticVarAccessCollection';
import { isNodeInstrumented } from './helpers/instrumentationHelper';


// ###########################################################################
// Build custom dbux state object
// ###########################################################################

/**
 * Build the state used by dbux-babel-plugin throughout the entire AST visit.
 */
export default function injectDbuxState(programPath, programState) {
  const filePath = programState.filename;
  const fileName = filePath && pathGetBasename(filePath);

  const { scope } = programPath;
  const { file: programFile } = programState;

  const dbuxState = {
    // static program data
    programFile,
    filePath,
    fileName,

    contexts: new StaticContextCollection(programState),
    traces: new StaticTraceCollection(programState),
    varAccess: new StaticVarAccessCollection(programState),
    loops: new StaticLoopCollection(programState),

    ids: {
      dbuxInit: scope.generateUid('dbux_init'),
      dbuxRuntime: scope.generateUid('dbuxRuntime'),
      dbux: scope.generateUid('dbux')
    },
    // console.log('[Program]', state.filename);

    // ###########################################################################
    // getters
    // ###########################################################################

    getClosestAncestorData(path, dataName) {
      const staticContextParent = path.findParent(p => !!p.getData(dataName));
      return staticContextParent?.getData(dataName);
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
      if (!path.node || isNodeInstrumented(path.node)) {
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
      if (!path.node || isNodeInstrumented(path.node)) {
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
    }
  };

  Object.assign(programState, dbuxState);

  return programState;
}