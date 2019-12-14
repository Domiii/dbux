/**
 * Build the state shared throughout the entire AST visit.
 */
export default function buildProgramVisitorState() {
  const entered = new Set();
  const exited = new Set();

  return {
    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onEnter(path) {
      if (entered.has(path)) {
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
    }
  };
}