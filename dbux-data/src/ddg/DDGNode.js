import DDGEntity from './DDGEntity';

export default class DDGNode extends DDGEntity {
  /**
   * @param {number} 
   * @param {number} dataNodeId
   * @param {string} label
   */
  constructor(ddgNodeType, dataNodeId, label) {
    super();
    this.type = ddgNodeType;
    this.dataNodeId = dataNodeId;
    this.label = label;
  }
}
