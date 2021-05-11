import ParseNodeFeature from '../../parseLib/ParseNodeFeature';

/**
 * This is for ClassDeclaration, FunctionDeclaration.
 * 
 * We separately track `VariableDeclarator`.
 * 
 * TODO: Export*, Import*
 * future work: EnumDeclaration?
 */
export default class DeclarationStatement extends ParseNodeFeature {
  instrument() {
    // TODO: add td(name, tid) behind
  }
}
