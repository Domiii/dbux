import { newLogger } from '@dbux/common/src/log/logger';
import isEmpty from 'lodash/isEmpty';
import DialogNode from './DialogNode';
import { showInformationMessage } from '../../codeUtil/codeModals';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('MessageNode');

export default class MessageNode extends DialogNode {
  static async render(dialog, node) {
    const { nodeName } = dialog.graphState;
    
    let { edges = [] } = node;
    if (nodeName !== 'start' && nodeName !== 'end') {
      edges = edges.concat(dialog.graph.defaultEdges);
    }

    const buttons = await dialog.makeButtonsByEdges(node, edges, nodeName);
    if (isEmpty(buttons)) {
      showInformationMessage(await dialog.maybeGetByFunction(node.text, node), buttons).catch(logError);
      return null;
    }
    else {
      const result = await showInformationMessage(await dialog.maybeGetByFunction(node.text, node), buttons);
      return result;
    }
  }
}