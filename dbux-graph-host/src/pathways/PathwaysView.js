import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class PathwaysView extends HostComponentEndpoint {
  
  shared() {
    return {
      context: {
        pathwaysView: this
      }
    };
  }
}

export default PathwaysView;