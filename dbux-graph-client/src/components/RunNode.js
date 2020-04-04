import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import ContextNode from './ContextNode';
import { setElementStyle } from '../util/domUtil';

class RunNode extends ClientComponentEndpoint {
  initEl() {
    const { runId } = this.state;

    const node = document.createElement('div');
    node.textContent = `Run #${runId}`;
    setElementStyle(node, {
      backgroundColor: 'red'
    });

    return node;
  }
}

export default RunNode;