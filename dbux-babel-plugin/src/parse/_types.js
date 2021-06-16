import BaseNode from './BaseNode';

/**
 * A `ParseNode` that has an lval child.
 * 
 * @interface
 */
export class LValHolderNode extends BaseNode {
  /**
   * @returns {BaseNode}
   */
  getDeclarationNode() {}

  decorateWriteTraceData(traceData) {}
}