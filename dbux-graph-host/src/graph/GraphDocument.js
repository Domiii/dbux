import NanoEvents from 'nanoevents';
import allApplications from '@dbux/data/src/applications/allApplications';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import GraphType from '@dbux/graph-common/src/shared/GraphType';
import GraphMode, { getEnabledGraphTypesByMode } from '@dbux/graph-common/src/shared/GraphMode';
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

    // TODO-M refresh graphs when `allApplications.selection.onApplicationsChanged`
  }

  createOwnComponents() {
    // TODO-M: add toolbar register system
    this.controllers.createComponent('PopperManager');
    this.syncGraph = this.children.createComponent('GraphContainer', { graphType: GraphType.SyncGraph }).graph;
    this.asyncGraph = this.children.createComponent('GraphContainer', { graphType: GraphType.AsyncGraph }).graph;
    this.asyncStack = this.children.createComponent('GraphContainer', { graphType: GraphType.AsyncStack }).graph;
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
      const enabledGraphTypes = getEnabledGraphTypesByMode(mode);
      this.refreshGraphs(enabledGraphTypes);
      this._emitter.emit('graphModeChanged', mode);
    }
  }

  refreshGraphs(enabledGraphTypes) {
    enabledGraphTypes = new Set(enabledGraphTypes);
    const graphContainers = this.children.getComponents('GraphContainer');
    graphContainers.forEach((container) => {
      if (enabledGraphTypes.has(container.state.graphType)) {
        container.setState({ enabled: true });
        container.graph.refresh();
      }
      else {
        container.setState({ enabled: false });
        container.graph.clear();
      }
    });
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