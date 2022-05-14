import DDGEntity from './DDGEntity';

export default class DDGNode extends DDGEntity {
  /**
   * @param {number} 
   * @param {number} dataNodeId
   */
  constructor(ddgNodeType, dataNodeId) {
    super();
    this.type = ddgNodeType;
    this.dataNodeId = dataNodeId;
  }
}
