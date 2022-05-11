import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

export default class DDGTimelineView extends HostComponentEndpoint {
  init() {
  }

  update() {

  }

  shared() {
    return {
      context: {
        view: this
      }
    };
  }
}
