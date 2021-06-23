import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceExpressionVar } from '../instrumentation/builders/misc';
import BaseId from './BaseId';

const ConstantIds = new Set([
  'undefined',
  'NaN',
  'Infinity'
]);

export default class ReferencedIdentifier extends BaseId {
  isConstant;

  /**
   * 
   */
  buildDefaultTrace() {
    const { path, isConstant } = this;

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: !isConstant ? TraceType.Identifier : TraceType.Literal
      },
      meta: {
      }
    };

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