export default class AsyncNodeDataMap {
  /**
   * @type {Map<string, >}
   */
  _nodes;

  constructor() {
    this._nodes = new Map();
  }

  add(asyncNodeData) {
    const { asyncNode: { applicationId, asyncNodeId } } = asyncNodeData;
    this._nodes.set(this._makeKey(applicationId, asyncNodeId), asyncNodeData);
  }

  get(applicationId, asyncNodeId) {
    return this._nodes.get(this._makeKey(applicationId, asyncNodeId));
  }

  getByNode({ applicationId, asyncNodeId }) {
    return this.get(applicationId, asyncNodeId);
  }

  clear() {
    this._nodes.clear();
  }

  _makeKey(applicationId, asyncNodeId) {
    return `${applicationId}_${asyncNodeId}`;
  }
}
