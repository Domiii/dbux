import allApplications from '@dbux/data/src/applications/allApplications';
import DataNode from './DataNode';

export default class ChildDataNode extends DataNode {
  static makeLabel(trace, parent, props) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const node = dp.collections.dataNodes.getById(props.nodeId);
    return `[${node.varAccess?.prop}]`;
  }

  canHaveChildren() {
    return false;
  }
}
