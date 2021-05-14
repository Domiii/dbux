
export default class StaticDataNode {
  // staticTraceId;

  /**
   * Is `true` if this node:
   * * created a new value or
   * * modified an existing value
   * 
   * NOTE: even if `true`, input and output might nevertheless be the same.
   * 
   * @type {boolean}
   */
  isNew;

  /**
   * @see {DataNodeType}
   * @type {number}
   */
  type;
}