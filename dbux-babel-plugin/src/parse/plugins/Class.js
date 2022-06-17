import TraceType from '@dbux/common/src/types/constants/TraceType';
import merge from 'lodash/merge';
import { findConstructorMethod } from '../../visitors/classUtil';
import ClassMethod from '../ClassMethod';
import ClassProperty from '../ClassProperty';
import BasePlugin from './BasePlugin';

/** @typedef { import("../MemberExpression").default } MemberExpression */

function methodNames(methods) {
  /** {@link ClassMethod#name} */
  return methods.map(m => m.trace.node.name);
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
    const { node, node: { path: classPath, Traces } } = this;
    const [idNode] = node.getChildNodes();
    const [, , bodyPath] = node.getChildPaths();
    const memberPaths = bodyPath.get('body');

    // TODO: `['get', 'set'].includes(kind)`

    // add all class member traces
    // also, get all types of ClassMethods
    const staticMethods = [], publicMethods = [], privateMethods = [];

    for (const memberPath of memberPaths) {
      /**
       * @type {ClassMethod | ClassProperty}
       */
      const memberNode = node.getNodeOfPath(memberPath);

      // ################################################################################
      // memberTrace
      // ################################################################################

      const astNode = memberNode.path.node;
      const isMethod = memberNode instanceof ClassMethod && 
        (astNode.kind === 'method' || astNode.kind === 'constructor');

      // console.warn(memberNode.path.toString(), isMethod);

      const memberTraceCfg = memberNode.addTrace();   // addTrace

      // register all method names
      if (isMethod) {
        const { static: isStatic } = astNode;
        const { isPublic } = memberNode;
        
        let methods;
        if (isStatic) {
          methods = staticMethods;
        }
        else {
          methods = isPublic ? publicMethods : privateMethods;
        }
        methods.push({
          trace: memberTraceCfg
        });
      }
    }


    // ################################################################################
    // instanceTrace
    // ################################################################################

    // TODO: instance and prop initializers are all in the context of the ctor
    const instanceTraceCfg = Traces.addTrace({
      path: findConstructorMethod(classPath) || classPath.get('body'),
      node: null,
      scope: node.peekContextNode().path.scope, // prevent adding `tid` variable to own body
      staticTraceData: {
        type: TraceType.ClassInstance,
        dataNode: {
          isNew: true
        },
        data: {
          privateMethods: methodNames(privateMethods)
        }
      },
      data: {
        privateMethods
      },
      meta: {
        // NOTE: will be instrumented by class trace below
        instrument: null
      }
    });


    // ################################################################################
    // classTrace
    // ################################################################################

    const classTraceData = {
      node,
      path: classPath,
      staticTraceData: {
        type: idNode ? TraceType.ClassDeclaration : TraceType.ClassDefinition,
        dataNode: {
          isNew: true
        },
        data: {
          name: idNode?.path?.toString(),
          staticMethods: methodNames(staticMethods),
          publicMethods: methodNames(publicMethods)
        }
      },
      data: {
        instanceTraceCfg,
        staticMethods,
        publicMethods
      },
      meta: {
      }
    };
    // console.warn('classTraceData', classTraceData.staticTraceData);
    return Traces.addTrace(merge(classTraceData, moreTraceData));
  }
}