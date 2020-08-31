import DialogNode from './DialogNode';
import { showInformationMessage } from '../../codeUtil/codeModals';
import { makeButtonsByEdges } from '../tutorialUtil';

export default class MessageNode extends DialogNode {
  static async render(state, node, defaultEdges) {
    let { edges } = node;

    if (state !== 'start' && state !== 'end') {
      edges = edges.concat(defaultEdges);
    }

    const buttons = await makeButtonsByEdges(edges, state);

    const result = await showInformationMessage(node.text, buttons, { modal: true });
    return result;
  }
}