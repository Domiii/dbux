import * as t from '@babel/types';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceExpression } from '../instrumentation/builders/misc';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class ClassMethod extends BaseNode {
  static children = [
    'key',
    'params',
    'body'
  ];
  static plugins = [
    'Function',
    'StaticContext'
  ];

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

  addDefaultTrace() {
    // TODO: `decorators`

    /**
     * TODO: `ObjectMethod` -> `kind !== 'method'`
     *  -> Consider using `defineProperty`
     *  -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get#defining_a_getter_on_existing_objects_using_defineproperty
     *
     * Consider:
     * ```js
       var o = {
        a: 0,
        get b() { return this.a + 1; }
      };
      Object.getOwnPropertyDescriptor(o, 'b')
      ```
     */

    const [keyNode] = this.getChildNodes();
    // NOTE: non-computed keys don't have their own ParseNode (for now).
    //      `ObjectExpression` instrumentation will assure correct traces + DataNodes nevertheless.
    keyNode?.addDefaultTrace();

    return super.addDefaultTrace();
  }

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