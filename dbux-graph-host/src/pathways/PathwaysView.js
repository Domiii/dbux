import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class PathwaysView extends HostComponentEndpoint {
  handleRefresh() {
    
  }
  
  shared() {
    return {
      context: {
        pathwaysView: this
      }
    };
  }
}

export default PathwaysView;