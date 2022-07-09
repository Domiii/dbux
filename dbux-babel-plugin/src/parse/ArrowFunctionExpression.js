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

    let scopePath = path;
    do {
      // NOTE: this is to prevent adding `definitionTid` to own body
      // hackfix for edge cases: we are a default parameter inside a method's assignment pattern etc.
    // future-work: move things, so the  function and its `definitionTid` are both in the same scope
      scopePath = scopePath.parentPath;
    } while (scopePath && !scopePath.isBlock());
    const scope = scopePath?.scope || path.parentPath.scope;


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
