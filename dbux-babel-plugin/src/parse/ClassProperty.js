import * as t from '@babel/types';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { buildTraceWriteClassProperty } from '../instrumentation/builders/classes';
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

  getClassVar() {
    const classNode = this.peekPlugin('Class').node;
    return classNode.classVar;
  }

  /**
   * When encountering this property, 
   */
  addObjectTrace() {
    const { path, Traces } = this;
    const [keyPath] = this.getChildPaths();
    const { static: isStatic } = path.node;
    const targetNode = isStatic ?
      this.getClassVar() :  // static property is called on class var
      thisAstNode;          // instance property

    return Traces.addTrace({
      path: keyPath,
      staticTraceData: {
        type: TraceType.Identifier
      },
      meta: {
        targetNode,

        // NOTE: will be instrumented during `targetNode` call below
        instrument: null
      }
    });
  }


  addTrace() {
    const { path, Traces } = this;

    const [keyNode] = this.getChildPaths();
    const [, valuePath] = this.getChildPaths();

    const { computed } = path.node;

    let propertyAstNode;
    if (computed) {
      // only assign `propertyAstNode` if computed
      // NOTE: this is because private properties do not support dynamic access
      // see: https://github.com/tc39/proposal-private-fields/issues/94
      keyNode?.addDefaultTrace();
      propertyAstNode = Traces.generateDeclaredUidIdentifier('p');
    }

    // add trace for `this` or `className`
    const objectTraceCfg = this.addObjectTrace();
    const objectTid = objectTraceCfg.tidIdentifier;

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ClassProperty
      },
      data: {
        objectTraceCfg,
        objectTid,
        propertyAstNode
      },
      meta: {
        build: buildTraceWriteClassProperty,
      }
    };

    return Traces.addTraceWithInputs(traceData, valuePath && [valuePath] || EmptyArray);
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