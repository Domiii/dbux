export default class AsyncNodeData {
  asyncNode;
  // executionContext;

  displayName;
  locLabel;
  syncInCount;
  syncOutCount;
  parentEdges;
  parentEdgeType;
  parentAsyncNodeId;
  nestingDepth;

  /**
   * @type {boolean} Whether this is a program (file). If `false`, it's a function.
   */
  isProgramRoot;
  realStaticContextid;
  packageName;
  postAsyncEventUpdateType;
  hasError;
}