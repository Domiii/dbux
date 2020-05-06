import HostComponentEndpoint from 'dbux-graph-host/src/componentLib/HostComponentEndpoint';
import { getClosestPackageJsonNameOrPath } from '../../../../dbux-data/src/util/nodeUtil';

export default class Highlighter extends HostComponentEndpoint {
  get manager() {
    return this.context.graphDocument.controllers.getController('HighlightManager');
  }

  init() {
    this.state.enabled = 0;
  }

  inc() {
    this.setState({
      enabled: this.state.enabled + 1
    });
    this.manager.highlighterUpdated(this);
  }

  dec() {
    this.setState({
      enabled: this.state.enabled - 1
    });
    this.manager.highlighterUpdated(this);
  }
}