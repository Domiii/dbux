import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceExpressionVar } from '../instrumentation/builders/misc';
import BaseId from './BaseId';

export default class ReferencedIdentifier extends BaseId {
  // ###########################################################################
  // inputs
  // ###########################################################################

  /**
   * 
   */
  createDefaultTrace() {
    const rawTraceData = {
      path: this.path,
      node: this,
      staticTraceData: {
        type: TraceType.Identifier
      },
      meta: {
        build: buildTraceExpressionVar
      }
    };

    return rawTraceData;
  }

  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    // if (!binding) {
    //   throw new Error(`Weird Babel issue - ReferencedIdentifier does not have binding - ${this}`);
    // }

    this.peekStaticContext().addReferencedBinding(this);
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