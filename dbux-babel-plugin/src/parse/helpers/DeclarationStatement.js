
/** @typedef { import("../BaseNode").default } BaseNode */

/**
 * This is for ClassDeclaration, FunctionDeclaration.
 * 
 * We separately track `VariableDeclarator`.
 * 
 * TODO: Export*, Import*
 * future work: EnumDeclaration?
 */
export default class DeclarationStatement {
  /**
   * @type {BaseNode}
   */
  parseNode;

  instrument() {
    // TODO: add td(name, tid) behind
  }
}