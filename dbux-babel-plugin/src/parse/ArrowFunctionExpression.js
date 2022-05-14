import * as t from "@babel/types";
import BaseNode from './BaseNode';
import Function from './plugins/Function';

export default class ArrowFunctionExpression extends BaseNode {
  static children = ['params', 'body'];
  static plugins = [
    'Function',
    'StaticContext'
  ];

  get dontInstrumentContextEnd() {
    // -> does not have a block if it has a custom created return statement
    return !!this.data.returnTraceCfg;
  }

  exit() {
    const { path } = this;
    const [, bodyPath] = this.getChildPaths();

    /**
     * @type {import('./plugins/Function').default}
     */
    const func = this.getPlugin('Function');
    if (!bodyPath.isBlockStatement()) {
      // body is lambda expression -> wrap body with "return trace"
      this.data.returnTraceCfg = this.Traces.addReturnTrace(func, null, bodyPath, bodyPath);
    }
    const { scope } = path.parentPath; // prevent adding `tid` variable to own body

    const traceData = {
      node: this,
      path,
      scope,
      staticTraceData: func.createStaticTraceData(null, null, { label: '=>' })
    };

    const traceCfg = this.Traces.addTrace(traceData);
    func.setFunctionTraceCfg(traceCfg);
  }

  instrument1() {
    const {
      data: {
        returnTraceCfg
      }
    } = this;

    if (returnTraceCfg) {
      const [, bodyPath] = this.getChildPaths();
      // let bodyNode = bodyPath.node;

      // NOTE: This enables us to add `try/finally`
      // NOTE2: `return` implies `ContextEnd`.

      // bodyPath.replaceWith(  // <- this (for some reason) injects an iife
      //   t.blockStatement([t.returnStatement(bodyNode)])
      // );

      this.path.ensureBlock();
    }
  }
}
