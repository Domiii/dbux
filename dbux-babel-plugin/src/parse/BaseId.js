// import { Binding } from '@babel/traverse';
// import TraceType from '@dbux/common/src/types/constants/TraceType';
import { getPathBinding } from 'src/helpers/bindingsUtil';
import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';

/**
 * BaseId provides binding-related utilities.
 * 
 * NOTE: The `bindingPath` (and thus `bindingNode`) is often the parent of the `BindingIdentifier`.
 */
export default class BaseId extends BaseNode {
  /**
   * @type {Binding}
   */
  _binding;

  get binding() {
    if (!this._binding) {
      this._binding = getPathBinding(this.path);
    }
    return this._binding;
  }

  getOwnDeclarationNode() {
    const path = this.binding?.path;
    if (!path) {
      return null;
    }
    // NOTE: `binding.path` (if is `Declaration`) refers to the Declaration, not the `id` node.
    // NOTE2: even more odd - for `CatchClause.param` it returns `CatchClause` the path.
    let declarationNode;
    if (path.isIdentifier()) {
      declarationNode = this.getNodeOfPath(path);
    }
    else if (path.node.id) {
      // hackfix: check for declaration
      // future-work: this is a declaration -> override `getDeclarationNode` there instead
      declarationNode = this.getNodeOfPath(path.get('id'));
    }
    else {
      declarationNode = this.getNodeOfPath(path);
    }

    if (!declarationNode) {
      this.logger.warn(`Binding path did not have ParseNode: ${pathToString(path)} in "${this}" in "${this.getParentString()}"`);
      return null;
    }
    declarationNode = declarationNode === this ? declarationNode : declarationNode.getOwnDeclarationNode?.();
    return declarationNode;
  }
}
