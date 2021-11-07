export default class AsyncNodeDataMap {
  /**
   * @type {Map<string, >}
   */
  _nodes;

  constructor() {
    this._nodes = new Map();
  }

  add(asyncNodeData) {
    const { applicationId, asyncNodeId } = asyncNodeData.asyncNode;
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

  forEach(cb) {
    return this._nodes.forEach(cb);
  }

  _makeKey(applicationId, asyncNodeId) {
    return `${applicationId}_${asyncNodeId}`;
  }
}
