import { newLogger } from '@dbux/common/src/log/logger';
import DialogNode from './DialogNode';
import { showInformationMessage } from '../../codeUtil/codeModals';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('MessageNode');

export default class MessageNode extends DialogNode {
  static async render(dialog, node) {
    const { nodeName } = dialog.graphState;

    let { end = false, edges = [] } = node;
    if (!end) {
      edges = edges.concat(dialog.graph.defaultEdges);
    }

    const text = await dialog.maybeGetByFunction(node.text, node);
    const buttons = await dialog.makeButtonsByEdges(node, edges, nodeName);
    const edgeData = await showInformationMessage(text, buttons, { modal: true });
    return edgeData;
  }
}