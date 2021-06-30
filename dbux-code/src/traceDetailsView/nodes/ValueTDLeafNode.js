import ValueNode from './ValueNode';

/**
 * Node contains pure value, no entry(dataNode) available
 */
export default class ValueTDLeafNode extends ValueNode {
  static makeProperties(/*entry, parent, props*/) { }

  static makeLabel(entry, parent, props) {
    const { key, value } = props;
    if ('value' in props) {
      return `${key}: ${JSON.stringify(value)}`;
    }
    return key;
  }

  canHaveChildren() {
    return false;
  }
}