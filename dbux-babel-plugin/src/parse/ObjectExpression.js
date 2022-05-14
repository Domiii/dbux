import TraceType from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
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

  /**
   * Takes a an array of arguments to indicate which are `SpreadElement` and which not.
   * 
   * NOTE: This is used by `ObjectExpression`.
   */
  makeArgsCfg(propertyPaths) {
    return propertyPaths?.map((propPath) => ({
      key: propPath.node.key,
      isSpread: propPath.isSpreadElement(),
      kind: propPath.node.kind
    })) || EmptyArray;
  }

  // enter() {
  //   console.error('OE disabled', this.path.getData('disabled'), this.path._traverseFlags);
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
          isNew: true,
          label: '{}'
        },
        data: {
          argConfigs: this.makeArgsCfg(propertyPaths)
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