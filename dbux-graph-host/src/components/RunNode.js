import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import ContextNode from './ContextNode';

class RunNode extends HostComponentEndpoint {
  init() {
    const { runId } = this.state;
    const contexts = null; // TODO: get contexts in selected application
    this.setChildren(contexts.map(context => this.children.addComponent(ContextNode, { context })));
  }
}

export default RunNode;