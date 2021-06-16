import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';

// ###########################################################################
// util
// ###########################################################################

const LValPluginsByType = {
  Identifier: 'UpdateLValVar',
  MemberExpression: 'UpdateLValME'
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
// UpdateExpression
// ###########################################################################

export default class UpdateExpression extends BaseNode {
  static children = ['argument'];
  static plugins = [
    getLValPlugin
  ];

  exit() {
    const [argNode] = this.getChildNodes();
    argNode.addDefaultTrace();
  }

  /**
   * @returns {BaseNode}
   */
  getDeclarationNode() {
    const [argNode] = this.getChildNodes();
    return argNode.getDeclarationNode();
  }

  decorateWriteTraceData(traceData) {
    const { path } = this;
    // const [argNode] = this.getChildNodes();
    traceData.staticTraceData.dataNode = {
      isNew: true
    };

    traceData.path = path;
    traceData.node = this;
    traceData.meta.replacePath = path;
  }
}
