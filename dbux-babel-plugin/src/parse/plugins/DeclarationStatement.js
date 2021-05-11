import ParsePlugin from '../../parseLib/ParsePlugin';

/**
 * This is for ClassDeclaration, FunctionDeclaration.
 * 
 * We separately track `VariableDeclarator`.
 * 
 * TODO: Export*, Import*
 * future work: EnumDeclaration?
 */
export default class DeclarationStatement extends ParsePlugin {
  instrument() {
    // TODO: add td(name, tid) behind
  }
}
