import fsPath from 'path';
import { getPresentableString } from './helpers/misc';

function getFilePath(state) {
  let filename = state.filename && fsPath.normalize(state.filename) || 'unknown_file.js';
  const cwd = fsPath.normalize(state.cwd);
  if (filename.startsWith(cwd)) {
    filename = fsPath.relative(state.cwd, filename);
  }
  return filename;
}

/**
 * Build the state used by dbux-babel-plugin throughout the entire AST visit.
 */
export default function injectDbuxState(programPath, programState) {
  const filePath = getFilePath(programState);
  const fileName = fsPath.basename(filePath);

  const { scope } = programPath;
  
  const staticContexts = [null]; // staticId = 0 is always null
  const traces = [null];

  const dbuxState = {
    // static program data
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

    onTrace(path) {
      return dbuxState.onEnter(path, 'trace');
    },

    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onEnter(path, purpose) {
      const key = '_dbux_entered' + purpose;
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
      const key = '_dbux_entered' + purpose;
      // entered.add(path);
      path.setData(key, true);
    },

    markExited(path, purpose) {
      const key = '_dbux_entered' + purpose;
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

    getClosestStaticId(path) {
      return programState.getClosestAncestorData(path, 'staticId');
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
      // console.log('STATIC', path.get('id')?.name, '@', `${state.filename}:${line}`);
      const staticId = staticContexts.length;
      const parentStaticId = dbuxState.getClosestStaticId(path);
      // console.log('actualParent',  toSourceString(actualParent.node));
      const { loc } = path.node;
      staticContexts.push({
        _staticId: staticId,
        _parentId: parentStaticId,
        loc,
        ...data
      });

      path.setData('staticId', staticId);
      return staticId;
    },

    addResumeContext(parentStaticId, locStart) {
      const parent = dbuxState.getStaticContext(parentStaticId);
      const staticId = staticContexts.length;
      const loc = {
        start: locStart,
        end: null     // we don't know where it ends yet (can only be determined at run-time)
      };
      staticContexts.push({
        type: 5, // : StaticContextType
        staticId,
        parent: parentStaticId,
        displayName: parent.displayName,
        loc
      });
      return staticId;
    },

    addTrace(path, capturesValue=false) {
      // console.log('TRACE', '@', `${state.filename}:${line}`);
      const traceId = traces.length;
      const parentStaticId = programState.getClosestStaticId(path);
      // console.log('actualParent',  toSourceString(actualParent.node));
      const displayName = getPresentableString(path.toString(), 30);
      const { loc } = path.node;
      traces.push({
        displayName,
        _traceId: traceId,
        // _parentId: parentStaticId,
        capturesValue,
        loc
      });
      return traceId;
    }
  };
  
  Object.assign(programState, dbuxState);
  
  return programState;
}