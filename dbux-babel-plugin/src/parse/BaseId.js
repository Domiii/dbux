// import { Binding } from '@babel/traverse';
// import TraceType from '@dbux/common/src/types/constants/TraceType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import SpecialIdentifierType, { isNotCalleeTraceableType, lookupSpecialIdentifierType } from '@dbux/common/src/types/constants/SpecialIdentifierType';
import { getPathBinding } from '../helpers/bindingsUtil';
import { pathToString, pathToStringAnnotated } from '../helpers/pathHelpers';
import { buildTraceExpressionVar } from '../instrumentation/builders/misc';
import { ZeroNode } from '../instrumentation/builders/buildUtil';
import BaseNode from './BaseNode';

export const DataNodeMetaBySpecialIdentifierType = {
  [SpecialIdentifierType.Module]: {
    shallow: true
  },

  /**
   * NOTE: we don't want to trace proxy initial properties, since that tends to cause unwanted side-effects.
   * E.g. `chai/lib/chai/utils/proxify.js`
   */
  [SpecialIdentifierType.Proxy]: {
    shallow: true
  }
};



/**
 * BaseId provides binding-related utilities.
 * 
 * NOTE: The `bindingPath` is often the parent of the `BindingIdentifier`.
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

  get isGlobal() {
    return !this.binding;
  }

  getOwnDeclarationNode() {
    let path = this.binding?.path;
    if (!path) {
      return null;
    }

    // hackfix: check for actual declaration node
    if (path.node.id) {
      // future-work: this is a declaration -> override `getDeclarationNode` in AST node class instead
      path = path.get('id');
    }
    else if (path.node.local) {
      // hackfix for `Import{Default}Specifier`
      path = path.get('local');
    }
    else if (path.node.argument) {
      // hackfix for `RestElement`
      path = path.get('argument');
    }
    else if (path.node.param) {
      // hackfix for `CatchClause`
      path = path.get('param');
    }
    else if (path.node.left) {
      // hackfix for `AssignmentPattern`
      path = path.get('left');
    }

    // NOTE: `binding.path` (if it is `Declaration`) refers to the Declaration, not the `id` node.
    // NOTE2: even more odd - for `CatchClause.param` it returns `CatchClause`.
    let declarationNode;
    if (path.isIdentifier()) {
      declarationNode = this.getNodeOfPath(path);
    }

    if (!declarationNode) {
      // TODO: support for `RestElement`
      if (this.state.verbose.nyi) {
        this.logger.warn(`[NYI] Could not look up binding path for lval:" ${pathToStringAnnotated(path)}" (in "${this}")`); // in "${this.getParentString()}")`);
      }
      return null;
    }
    declarationNode = declarationNode === this ? declarationNode : declarationNode.getOwnDeclarationNode?.();
    return declarationNode;
  }

  /**
   * 
   */
  buildDefaultTraceBase() {
    const { path, isConstant, specialType } = this;

    // specialType && console.warn(specialType, this.toString());

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: !isConstant ? TraceType.Identifier : TraceType.Literal,
        dataNode: {
          // whether the value is ensured to not have been previously recorded.
          isNew: isConstant,
          ...this.getDataNodeMeta()
        },
        data: {
          // specialType
        }
      },
      meta: {}
    };

    if (specialType) {
      traceData.staticTraceData.data.specialType = specialType;
      // TODO: custom build functions by `specialType`
    }

    if (!isConstant) {
      traceData.meta.build = buildTraceExpressionVar;
    }

    return traceData;
  }

  /** ###########################################################################
   * specialTypes
   * ##########################################################################*/


  get specialType() {
    const { name } = this.path.node;
    return this.isGlobal &&
      lookupSpecialIdentifierType(name) ||
      null;
  }

  getTidIdentifier() {
    const { specialType } = this;

    if (specialType && isNotCalleeTraceableType(specialType)) {
      // NOTE: this identifier cannot be traced, and thus does not have a traceId
      return ZeroNode;
    }
    return super.getTidIdentifier();
  }

  getDeclarationTidIdentifier() {
    const { specialType } = this;

    if (specialType) {
      // hackfix: for now, just don't care about declarationTid
      //    NOTE: often times, we can use `refId` instead
      return ZeroNode;
    }
    return super.getDeclarationTidIdentifier();
  }

  getDataNodeMeta() {
    const { specialType } = this;
    return specialType && DataNodeMetaBySpecialIdentifierType[specialType];
  }
}
