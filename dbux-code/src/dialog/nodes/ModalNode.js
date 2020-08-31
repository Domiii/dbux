import DialogNode from './DialogNode';
import { showInformationMessage } from '../../codeUtil/codeModals';
import { makeButtonsByEdges } from '../dialogUtil';

export default class MessageNode extends DialogNode {
  static async render(graphState, node, defaultEdges) {
    let { edges } = node;

    if (graphState.state !== 'start' && graphState.state !== 'end') {
      edges = edges.concat(defaultEdges);
    }

    const buttons = await makeButtonsByEdges(edges, graphState.state);

    const result = await showInformationMessage(node.text, buttons, { modal: true });
    return result;
  }
}