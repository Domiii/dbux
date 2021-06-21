import BaseNode from './BaseNode';

/**
 * A `ParseNode` that has an lval child.
 * 
 * @interface
 */
export class LValHolderNode extends BaseNode {
  // eslint-disable-next-line getter-return
  get traceType() {}

  /**
   * Used by {@link Traces} to determine `declarationTid`.
   * TODO: `declarationTid` should not be handled by the system (just like ME data is also not handled by the system, but rather the ME nodes themselves).
   * 
   * @returns {BaseNode}
   */
  getDeclarationNode() {}

  decorateWriteTraceData(traceData) {}
}