import BaseNode from './BaseNode';

/**
 * 
 */
export default class ObjectProperty extends BaseNode {
  static children = [
    'key',
    'value'
  ];

  get traceCfg() {
    const [, valueNode] = this.getChildNodes();
    return valueNode?.traceCfg;
  }

  createDefaultTrace() {
    const { path } = this;
    if (path.node.shorthand || path.node.computed) {
      // TODO!
      return;
    }

    const [, valueNode] = this.getChildNodes();
    const traceData = valueNode?.createDefaultTrace();

    // TODO: if `shorthand`, we require further instrumentation (cannot replace as-is)
    // TODO: special key '__proto__'
    // TODO: `decorators`
    // see: https://babeljs.io/docs/en/babel-types#objectproperty

    // if (traceData.path === valueNode.path) {  // small sanity check
    //   // // NOTE: we actually tace `argument`, but we want the "selectable trace" to be the entire `SpreadElement`
    //   // traceData.path = this.path;
    //   // traceData.meta = traceData.meta || {};
    //   // traceData.meta.replacePath = argNode.path;
    // }

    return traceData;
  }
}