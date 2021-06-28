import * as t from '@babel/types';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceExpression, buildTraceWriteME } from '../instrumentation/builders/misc';
import BaseNode from './BaseNode';

const thisAstNode = t.thisExpression();

/**
 * 
 */
export default class ClassProperty extends BaseNode {
  static children = [
    'key',
    'value'
  ];

  exit() {
    const { path, Traces } = this;

    const [keyPath, valuePath] = this.getChildPaths();

    // add trace for `this`
    const thisTraceCfg = Traces.addTrace({
      path: keyPath,
      staticTraceData: {
        type: TraceType.Identifier
      },
      meta: {
        targetNode: thisAstNode,

        // NOTE: will be instrumented during `targetNode` call below
        instrument: null
      }
    });

    const objectTid = thisTraceCfg?.tidIdentifier;
    if (!objectTid) {
      this.warn(`objectNode did not have traceCfg.tidIdentifier in ${thisAstNode}`);
    }

    const propertyAstNode = path.scope.generateDeclaredUidIdentifier('p');

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.WriteME
      },
      data: {
        objectTid,
        propertyAstNode
      },
      meta: {
        build: buildTraceWriteME,
        targetNode(state) {
          return {
            left: buildTraceExpression(state, thisTraceCfg),
            right: valuePath.node,
            operator: '='
          };
        }
      }
    };

    Traces.addTraceWithInputs(traceData, [valuePath]);
  }

  // TODO: fix this
  // buildDefaultTrace() {
  //   const { path } = this;
  //   return {
  //     path,
  //     node: this,
  //     scope: path.parentPath.scope, // prevent adding `tid` variable to own body
  //     staticTraceData: {
  //       type: TraceType.ExpressionResult
  //     },
  //     dataNode: {
  //       isNew: true
  //     },
  //     meta: {
  //       instrument: this.convertToObjectProperty
  //     }
  //   };
  // }

  // addDefaultTrace() {
  //   // TODO: `decorators`

  //   /**
  //    * TODO: `ObjectMethod` -> `kind !== 'method'`
  //    *  -> Consider using `defineProperty`
  //    *  -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#defining_a_getter_on_existing_objects_using_defineproperty
  //    *
  //    * Consider:
  //    * ```js
  //      var o = {
  //       a: 0,
  //       get b() { return this.a + 1; }
  //     };
  //     Object.getOwnPropertyDescriptor(o, 'b')
  //     ```
  //    */

  //   const [keyNode] = this.getChildNodes();
  //   // NOTE: non-computed keys don't have their own ParseNode (for now).
  //   //      `ObjectExpression` instrumentation will assure correct traces + DataNodes nevertheless.
  //   keyNode?.addDefaultTrace();

  //   return super.addDefaultTrace();
  // }

  // convertToObjectProperty = () => {
  //   const { path, state, traceCfg } = this;

  //   const { key, params, body, generator, async, computed, shorthand, decorators } = path.node;

  //   traceCfg.meta.targetNode = t.functionExpression(t.isIdentifier(key) ? key : null, params, body, generator, async);
  //   const value = buildTraceExpression(state, traceCfg);

  //   path.replaceWith(t.objectProperty(
  //     key,
  //     value,
  //     computed,
  //     shorthand,
  //     decorators
  //   ));
  // }
}