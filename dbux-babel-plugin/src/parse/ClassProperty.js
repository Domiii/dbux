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
   * When encountering this property, we assign it to class or instance variable.
   * For that, we trace access to class or instance here.
   * The result is used by `writePropertyTemplate`.
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

    const [keyNode] = this.getChildNodes();
    const [, valuePath] = this.getChildPaths();

    /**
     * @see makeMETraceData
     */

    const { computed } = path.node;

    let propertyVar, propTid;
    if (computed) {
      // only assign `propertyVar` if computed
      // NOTE: this can work because private properties do not support dynamic access.
      // see: https://github.com/tc39/proposal-private-fields/issues/94
      const propTraceCfg = keyNode?.addDefaultTrace();
      propTid = propTraceCfg?.tidIdentifier;
      propertyVar = Traces.generateDeclaredUidIdentifier('p');
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
        propertyVar,
        propTid
      },
      meta: {
        build: buildTraceWriteClassProperty,
      }
    };

    return Traces.addTraceWithInputs(traceData, valuePath?.node && [valuePath] || EmptyArray);
  }
}