import TraceType from '@dbux/common/src/core/constants/TraceType';
import { makeSpreadableArgumentObjectCfg } from '../helpers/argsUtil';
import { buildObjectExpression } from '../instrumentation/builders/objects';
import BaseNode from './BaseNode';

/**
 * Convert: `{ a, b: 3, ...spread1, [c]() {}, [d]: f(), ...spread2 }`
 * To: `toe([['a', a], ['b', 3], spread1, ['c', function () {}], [d, f()], spread2], tids)`
 */
export default class ObjectExpression extends BaseNode {
  static children = ['properties'];

  // /**
  //  * Whether this OE is ES5.
  //  * Cannot have `SpreadElement`, `ObjectMethod`, `computed` or `shorthand` properties.
  //  * If `true`, can be instrument without reshaping.
  //  */
  // isES5() {
  //   const [properties] = this.getChildPaths();
  //   return !properties.some(
  //     el => el.isSpreadElement() || el.isObjectMethod() || el.node.computed || el.node.shorthand
  //   );
  // }

  exit() {
    // if (!this.isES5()) {
    //   this.warn(`Cannot properly instrument non-es5 ObjectExpression syntax yet: ${this}`);
    //   return;
    // }

    const { path } = this;
    const [propertyPaths] = this.getChildPaths();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: true
        },
        data: {
          argConfigs: makeSpreadableArgumentObjectCfg(propertyPaths)
        }
      },
      meta: {
        build: buildObjectExpression
      }
    };

    const inputs = propertyPaths;

    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}