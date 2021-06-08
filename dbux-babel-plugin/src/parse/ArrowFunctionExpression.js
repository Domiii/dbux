import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { getScopeBlockPath } from '../helpers/scopeHelpers';
import BaseNode from './BaseNode';

export default class ArrowFunctionExpression extends BaseNode {
  static children = ['params', 'body'];
  static plugins = [
    'Function',
    'StaticContext'
  ];

  exit() {
    const { path } = this;
    const [, bodyPath] = this.getChildPaths();
    const { scope } = path.parentPath;

    if (!bodyPath.isBlockStatement()) {
      // simple lambda expression -> convert to block lambda expression with return statement
      // NOTE: this is executed before `Function.exit`
      this.data.returnTraceCfg = this.Traces.addReturnTrace(null, bodyPath, bodyPath);
    }


    const traceData = {
      node: this,
      path,
      scope,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: true
        }
      }
    };

    this.Traces.addTrace(traceData);
  }

  instrument() {
    const {
      plugins: {
        Function: {
          data: {
            returnTraceCfg
          }
        }
      }
    } = this;

    if (returnTraceCfg) {
      const [, bodyPath] = this.getChildPaths();
      let bodyNode = bodyPath.node;
      
      // NOTE: This enables us to add `try/finally`
      // NOTE2: `return` implies `ContextEnd`.
      bodyPath.replaceWith(t.blockStatement([t.returnStatement(bodyNode)]));
    }
  }
}
