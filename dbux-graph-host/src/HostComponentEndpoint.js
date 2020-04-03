import ComponentEndpoint from 'dbux-graph-common/src/componentLib/ComponentEndpoint';
import HostChildrenProxy from './HostChildrenProxy';

/**
 * The Host endpoint controls the Client endpoint.
 */
class HostComponentEndpoint extends ComponentEndpoint {
  children;

  constructor() {
    super();
    
    this.children = new HostChildrenProxy();
  }
}

export default HostComponentEndpoint;