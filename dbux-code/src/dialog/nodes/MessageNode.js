import DialogNode from './DialogNode';
import { showInformationMessage } from '../../codeUtil/codeModals';

export default class MessageNode extends DialogNode {
  static async render(dialog, node) {
    const { nodeName } = dialog.graphState;
    
    let { edges = [] } = node;
    if (nodeName !== 'start' && nodeName !== 'end') {
      edges = edges.concat(dialog.graph.defaultEdges);
    }

    const buttons = await dialog.makeButtonsByEdges(node, edges, nodeName);
    const result = await showInformationMessage(await dialog.maybeGetByFunction(node.text, node), buttons);
    return result;
  }
}