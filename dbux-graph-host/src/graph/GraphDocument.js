import NanoEvents from 'nanoevents';
import allApplications from '@dbux/data/src/applications/allApplications';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import GraphType, { nextGraphType } from '@dbux/graph-common/src/shared/GraphType';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class GraphDocument extends HostComponentEndpoint {
  init() {
    this._emitter = new NanoEvents();

    // default mode settings
    this.state.graphMode = GraphType.AsyncGraph;
    this.state.followMode = true;
    this.state.locMode = true;
    this.state.callMode = true;
    this.state.valueMode = false;
    this.state.thinMode = false;
    this.state.stackEnabled = true;
    this.state.asyncDetailMode = false;

    this.createOwnComponents();

    // NOTE: this will be called immediately
    allApplications.selection.onApplicationsChanged(() => {
      this.refreshGraphs();
    });
  }

  createOwnComponents() {
    this.controllers.createComponent('PopperManager');
    this.syncGraphContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.SyncGraph });
    this.asyncGraphContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.AsyncGraph });
    this.asyncStackContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.AsyncStack });
    this.toolbar = this.children.createComponent('Toolbar');
  }

  update() {
    this.toolbar.forceUpdate();
  }

  /** ########################################
   * util
   *  ######################################*/

  getIconUri(fileName, modeName) {
    if (!fileName) {
      return null;
    }
    if (!modeName) {
      const themeMode = this.componentManager.externals.getThemeMode();
      modeName = ThemeMode.getName(themeMode).toLowerCase();
    }
    return this.componentManager.externals.getClientResourceUri(`${modeName}/${fileName}`);
  }

  // ###########################################################################
  // modes/events management
  // ###########################################################################

  /** ########################################
   * graph mode
   *  ######################################*/

  nextGraphMode() {
    this.setGraphMode(nextGraphType(this.state.graphMode));
  }

  setGraphMode(mode) {
    if (this.state.graphMode !== mode) {
      this.setState({ graphMode: mode });
      this.refreshGraphs();
      this._notifyGraphModeChanged(mode);
    }
  }

  _notifyGraphModeChanged(mode) {
    this._emitter.emit('graphModeChanged', mode);
  }

  onGraphModeChanged(cb) {
    return this._emitter.on('graphModeChanged', cb);
  }

  refreshGraphs() {
    this.children.getComponents('GraphContainer').forEach((container) => {
      container.refreshGraph();
    });
  }

  /** ########################################
   * follow mode
   *  ######################################*/

  toggleFollowMode() {
    const mode = !this.state.followMode;
    this.setFollowMode(mode);
    return mode;
  }

  setFollowMode(mode) {
    if (this.state.followMode !== mode) {
      this.setState({ followMode: mode });
      this._notifyFollowModeChanged(mode);
    }
  }

  _notifyFollowModeChanged(mode) {
    this._emitter.emit('followModeChanged', mode);
  }

  onFollowModeChanged(cb) {
    return this._emitter.on('followModeChanged', cb);
  }

  // ###########################################################################
  // state + context
  // ###########################################################################

  makeInitialState() {
    const themeMode = this.componentManager.externals.getThemeMode();
    const contextNodeIconUris = {
      [GraphNodeMode.Collapsed]: this.getIconUri('minus.svg'),
      [GraphNodeMode.ExpandChildren]: this.getIconUri('stack.svg'),
      [GraphNodeMode.ExpandSubgraph]: this.getIconUri('listItem.svg'),
    };
    return {
      themeMode,
      contextNodeIconUris
    };
  }

  shared() {
    return {
      context: {
        graphDocument: this,
        themeMode: this.state.themeMode,
        contextNodeIconUris: this.state.contextNodeIconUris
      }
    };
  }
}

export default GraphDocument;