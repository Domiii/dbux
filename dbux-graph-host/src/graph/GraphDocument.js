import NanoEvents from 'nanoevents';
import allApplications from '@dbux/data/src/applications/allApplications';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import GraphType from '@dbux/graph-common/src/shared/GraphType';
import GraphMode from '@dbux/graph-common/src/shared/GraphMode';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class GraphDocument extends HostComponentEndpoint {
  // ###########################################################################
  // init
  // ###########################################################################
  init() {
    this._emitter = new NanoEvents();
    this.state.graphMode = GraphMode.SyncGraph;

    this.createOwnComponents();

    allApplications.selection.onApplicationsChanged(() => {
      this.refreshGraphs();
    });
  }

  createOwnComponents() {
    // TODO-M: add toolbar register system
    this.controllers.createComponent('PopperManager');
    this.syncGraphContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.SyncGraph });
    this.asyncGraphContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.AsyncGraph });
    this.asyncStackContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.AsyncStack });
    this.toolbar = this.children.createComponent('Toolbar');
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
  // graph management
  // ###########################################################################

  nextGraphMode() {
    this.setGraphMode(GraphMode.nextValue(this.state.graphMode));
  }

  setGraphMode(mode) {
    if (this.state.graphMode !== mode) {
      this.setState({ graphMode: mode });
      this.refreshGraphs();
      this._notifyGraphModeChanged(mode);
    }
  }

  refreshGraphs() {
    this.children.getComponents('GraphContainer').forEach((container) => {
      container.refreshGraph();
    });
  }

  _notifyGraphModeChanged(mode) {
    this._emitter.emit('graphModeChanged', mode);
  }

  onGraphModeChanged(cb) {
    return this._emitter.on('graphModeChanged', cb);
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