import BaseNode from './BaseNode';

/**
 * A `ParseNode` that has an lval child.
 * 
 * @interface
 */
export class LValHolderNode extends BaseNode {
  // eslint-disable-next-line getter-return
  get traceType() {}

  // eslint-disable-next-line getter-return
  get hasSeparateDeclarationTrace() {}

  /**
   * Used by {@link Traces} to determine `declarationTid`.
   * 
   * @returns {BaseNode}
   */
  getDeclarationNode() { }

  /**
   * Returns the own declaration node.
   * `getDeclarationNode` calls this recursively.
   * 
   * @returns {BaseNode}
   */
  getOwnDeclarationNode() { }

  decorateWriteTraceData(traceData) {}
}