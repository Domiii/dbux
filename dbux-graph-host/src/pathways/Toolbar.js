import PathwaysMode from '@dbux/data/src/pathways/PathwaysMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.pathwaysMode = PathwaysMode.Normal;
  }

  public = {
    async setPathwaysMode(mode) {
      this.setState({
        pathwaysMode: mode
      });

      switch (mode) {
        case PathwaysMode.Analyze:
          await this.componentManager.externals.decorateVisitedTraces();
          break;
        default:
          await this.componentManager.externals.stopDecorating();
          break;
      }
    }
  }
}

export default Toolbar;