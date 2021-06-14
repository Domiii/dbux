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

  addDefaultTrace() {
    // TODO: `decorators`
    // TODO: special key '__proto__'
    // see: https://babeljs.io/docs/en/babel-types#objectproperty

    const [keyNode, valueNode] = this.getChildNodes();
    
    // NOTE: non-computed keys don't have their own ParseNode (for now).
    //      `ObjectExpression` instrumentation will assure correct traces + DataNodes nevertheless.
    keyNode?.addDefaultTrace();

    return valueNode?.addDefaultTrace();
  }
}