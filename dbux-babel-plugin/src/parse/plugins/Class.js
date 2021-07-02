import TraceType from '@dbux/common/src/core/constants/TraceType';
import merge from 'lodash/merge';
import ClassMethod from '../ClassMethod';
import BasePlugin from './BasePlugin';

/** @typedef { import("../MemberExpression").default } MemberExpression */

function buildMethodArray(methods) {
  return t.arrayExpression(methods.map(({ name }) => t.memberExpression(ThisNode, t.identifier(name))));
}

/**
 * Classes are instrumented as follows:
 * 
 * 1. Add `static __dbux_class = () => traceClass(CLASS, tid, staticNames)` property.
 * 2a. Add `#__dbux_instance = (function () { traceInstance(this, tid, privateNames); })()` property.
 * 2b. Add `delete this.__dbux_instance` to constructor.
 * 3. Add `CLASS.__dbux_class(), delete CLASS.__dbux_class` behind the class (depending on node type).
 * 
 * NOTEs:
 * * Adding `__dbux_class` and `#__dbux_instance` props is the only way to access private members.
 * * `__dbux_class` cannot be `private`:
 *    * It needs to be called **after** class is fully declared.
 *    * Else, we might not have access to a class variable (in case of anonymous `ClassExpression`).
 * * We delete both props as soon as we safely can.
 */
export default class Class extends BasePlugin {
  addClassTraces(moreTraceData) {
    const { node } = this;
    const [idNode, , bodyNode] = node.getChildNodes();
    const memberPaths = bodyNode.path.get('body');

    // add all class member traces
    // also, get all types of ClassMethods
    const staticMethods = [], publicMethods = [], privateMethods = [];

    for (const memberPath of memberPaths) {
      const memberNode = node.getNodeOfPath(memberPath);

      // ################################################################################
      // memberTrace
      // ################################################################################

      const memberTraceCfg = memberNode.addTrace({  // addTrace
        path: memberPath,
        node: memberNode,
        staticTraceData: {
          type: TraceType.ClassInstance,
          dataNode: {
            isNew: true
          },
          data: {
            name: idNode?.path?.toString()
          }
        },
        meta: {
          moreTraceCallArgs: [
            staticMethods
          ]
        }
      });

      // register all method names
      if (memberNode instanceof ClassMethod) {
        const { public: isPublic, static: isStatic } = memberNode.path.node;
        let methods;
        if (isStatic) {
          methods = staticMethods;
        }
        else {
          methods = isPublic ? publicMethods : privateMethods;
        }
        methods.push({
          name: memberNode.name,
          trace: memberTraceCfg
        });
      }
    }


    // ################################################################################
    // instanceTrace
    // ################################################################################

    const instanceTraceCfg = this.Traces.addTrace({
      path: idNode.path,
      node: null,
      staticTraceData: {
        type: TraceType.Class,
        dataNode: {
          isNew: true
        },
        data: {
          privateMethods
        }
      },
      meta: {
        moreTraceCallArgs: [
          staticMethods
        ]
      }
    });


    // ################################################################################
    // classTrace
    // ################################################################################

    const classTraceData = {
      staticTraceData: {
        type: TraceType.ClassDefinition,
        dataNode: {
          isNew: true
        },
        data: {
          name: idNode?.path?.toString(),
          publicMethods
        }
      },
      data: {
        instanceTraceCfg
      },
      meta: {
        moreTraceCallArgs: [
          staticMethods
        ]
      }
    };
    return this.Traces.addTrace(merge(classTraceData, moreTraceData));
  }
}