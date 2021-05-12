
export default class StaticDataNode {
  staticNodeId;
  staticTraceId;

  /**
   * Is `true` if this node:
   * * created a new value or
   * * modified an existing value
   * 
   * Might be `true`, but input and output might nevertheless be the same.
   * 
   * @type {boolean}
   */
  isNew;
  isWrite;
}