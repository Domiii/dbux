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

  name() {
    return this.path.get('key').toString();
  }

  addTrace() {
    const { path } = this;
    const [keyPath] = this.getChildPaths();

    return this.Traces.addTrace({
      path,
      node: this,
      staticTraceData: this.getPlugin('Function').createStaticTraceData(keyPath)
    });
  }
}