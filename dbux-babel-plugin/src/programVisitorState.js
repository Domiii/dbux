/**
 * Build the state shared throughout the entire AST visit.
 */
export default function buildProgramVisitorState() {
  const entered = new Set();
  const exited = new Set();
  const staticContexts = [];

  const state = {
    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onEnter(path) {
      if (entered.has(path)) {
        return false;
      }
      const { loc } = path.node;
      if (!loc) {
        // this node has been dynamically emitted; not part of the original source code -> not interested in it
        return false;
      }
      entered.add(path);
      return true;
    },

    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onExit(path) {
      if (exited.has(path)) {
        return false;
      }
      exited.add(path);
      return true;
    },

    getClosestAncestorData(path, dataName) {
      const staticContextParent = path.findParent(p => !!p.getData(dataName));
      return staticContextParent?.getData(dataName);
    },

    getClosestStaticId(path) {
      return state.getClosestAncestorData(path, 'staticId');
    },

    getClosestContextIdName(path) {
      return state.getClosestAncestorData(path, 'contextIdName');
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

    addStaticContext(path, data) {
      // console.log('STATIC', path.get('id')?.name, '@', `${state.filename}:${line}`);
      const staticId = staticContexts.length;
      const parentStaticId = state.getClosestStaticId(path);
      // console.log('actualParent',  toSourceString(actualParent.node));
      const { loc } = path;
      data = {
        staticId,
        parent: parentStaticId,
        loc,
        ...data
      };
      staticContexts.push(data);

      path.setData('staticId', staticId);
      return staticId;
    }
  };
  
  return state;
}