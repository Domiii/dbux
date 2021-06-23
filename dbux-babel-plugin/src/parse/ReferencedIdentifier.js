import TraceType from '@dbux/common/src/core/constants/TraceType';
import SpecialIdentifierType from '@dbux/common/src/core/constants/SpecialIdentifierType';
import { buildTraceExpressionVar } from '../instrumentation/builders/misc';
import BaseId from './BaseId';
import { ZeroNode } from '../instrumentation/builders/buildUtil';

const ConstantIds = new Set([
  'undefined',
  'NaN',
  'Infinity'
]);


const SpecialIdentifierTypeMap = {
  module: SpecialIdentifierType.Module,
  arguments: SpecialIdentifierType.Arguments
};


const DataNodeMetaBySpecialIdentifierType = {
  [SpecialIdentifierType.Module]: {
    omit: true
  }
};


export default class ReferencedIdentifier extends BaseId {
  isConstant;

  get specialType() {
    return !this.binding ? SpecialIdentifierTypeMap[this.path.node.name] : null;
  }

  getDeclarationTidIdentifier() {
    const { specialType } = this;

    if (specialType) {
    // hackfix: for now, just don't care about declarationTid
    //    NOTE: can use `refId` to trace access, since they 100% coincide)
      return ZeroNode;
    }
    return super.getDeclarationTidIdentifier();
  }

  /**
   * 
   */
  buildDefaultTrace() {
    const { path, isConstant, specialType } = this;

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: !isConstant ? TraceType.Identifier : TraceType.Literal,
        dataNode: {
          isNew: isConstant,
          omit: specialType && DataNodeMetaBySpecialIdentifierType[specialType]?.omit || false
        },
        data: { }
      },
      meta: { }
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

  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    this.isConstant = ConstantIds.has(this.path.node.name);

    if (!this.isConstant) {
      this.peekStaticContext().addReferencedBinding(this);
    }
  }

  // TODO: fix exports --

  // ExportDeclaration: {
  //   exit(path) {
  //     const {
  //       node,
  //       scope
  //     } = path;
  //     if (t.isExportAllDeclaration(node)) return;
  //     const declar = node.declaration;

  //     if (t.isClassDeclaration(declar) || t.isFunctionDeclaration(declar)) {
  //       const id = declar.id;
  //       if (!id) return;
  //       const binding = scope.getBinding(id.name);
  //       if (binding) binding.reference(path);
  //     } else if (t.isVariableDeclaration(declar)) {
  //       for (const decl of declar.declarations) {
  //         for (const name of Object.keys(t.getBindingIdentifiers(decl))) {
  //           const binding = scope.getBinding(name);
  //           if (binding) binding.reference(path);
  //         }
  //       }
  //     }
  //   }
  // },
}