import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';

/**
 * This is for ClassDeclaration, FunctionDeclaration.
 * 
 * We separately track `VariableDeclarator`.
 * 
 * TODO: Export*, Import*
 * future work: EnumDeclaration?
 */
export default class BindingNode extends ParsePlugin {
  instrument() {
    // TODO: call traceBinding
  }
}
