import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';


// ###########################################################################
// util
// ###########################################################################

const LValPluginsByType = {
  Identifier: 'LValIdentifier',
  ObjectPattern: 'LValPattern',
  ArrayPattern: 'LValPattern',
  MemberExpression: 'LValMemberExpression'
};

function getLValPlugin(node) {
  const [lvalPath] = node.getChildPaths();
  const lvalType = lvalPath.node.type;
  const pluginName = LValPluginsByType[lvalType];
  if (!pluginName) {
    node.logger.error(`unknown lval type: "${lvalType}" at "${pathToString(lvalPath)}"`);
  }
  // console.debug(`[LVAL] lvalType = ${lvalType} - ${pathToString(node.path)}`);
  return pluginName;
}

// ###########################################################################
// AssignmentExpression
// ###########################################################################

/**
 * 
 */
export default class AssignmentExpression extends BaseNode {
  static children = ['left', 'right'];
  static plugins = [
    getLValPlugin
  ];

  /**
   * @returns {BaseNode}
   */
  getDeclarationNode() {
    const [leftNode] = this.getChildNodes();
    return leftNode.getDeclarationNode();
  }

  decorateWriteTraceData(traceData) {
    const { path } = this;
    // const [lvalNode] = this.getChildNodes();

    // traceData.path = lvalNode.path;
    traceData.path = path;
    traceData.node = this;
    traceData.meta.replacePath = path;
  }
}