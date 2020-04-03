import HostComponentEndpoint from '../HostComponentEndpoint';
import ContextNode from './ContextNode';

class RunNode extends HostComponentEndpoint {
  init() {
    const contexts = null; // TODO
    this.setChildren(contexts.map(context => ContextNode.create({ context })));
  }
}

export default RunNode;