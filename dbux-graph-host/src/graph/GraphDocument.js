import NanoEvents from 'nanoevents';
import allApplications from '@dbux/data/src/applications/allApplications';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import StackMode from '@dbux/graph-common/src/shared/StackMode';
import GraphType, { nextGraphType } from '@dbux/graph-common/src/shared/GraphType';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

// const screenshotMode = true;
const screenshotMode = false;

class GraphDocument extends HostComponentEndpoint {
  init() {
    this._emitter = new NanoEvents();

    // default mode settings
    this.state.graphMode = GraphType.SyncGraph;
    this.state.stackMode = StackMode.Hidden;
    this.state.followMode = true;
    this.state.locMode = false;
    this.state.callMode = true;
    this.state.valueMode = false;
    this.state.thinMode = false;
    this.state.asyncDetailMode = true;

    this.createOwnComponents();

    // NOTE: this will be called immediately
    this.addDisposable(allApplications.selection.onApplicationsChanged(() => {
      this.handleApplicationsChanged();
      this.refreshGraphs();
    }));
  }

  createOwnComponents() {
    this.controllers.createComponent('PopperManager');
    this.syncGraphContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.SyncGraph });
    this.asyncGraphContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.AsyncGraph });
    this.asyncStackContainer = this.children.createComponent('GraphContainer', { graphType: GraphType.AsyncStack });
    this.searchBar = this.children.createComponent('SearchBar');
    this.toolbar = this.children.createComponent('Toolbar');
  }

  update() {
    this.toolbar.forceUpdate();

    // TODO: [performance] better mechanic
    // hackfix: use this to toggle highContract mode with async detail mode(refresh every time we toggle the mode)
    this.refreshGraphs();
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
      // refresh in update
      // this.refreshGraphs();
      this._notifyGraphModeChanged(mode);
    }
  }

  _notifyGraphModeChanged(mode) {
    this._emitter.emit('graphModeChanged', mode);
  }

  onGraphModeChanged(cb) {
    return this._emitter.on('graphModeChanged', cb);
  }

  handleApplicationsChanged() {
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
  // initial state + context
  // ###########################################################################

  makeInitialState() {
    const themeMode = this.componentManager.externals.getThemeMode();
    const contextNodeIconUris = {
      [GraphNodeMode.Collapsed]: this.getIconUri('minus.svg'),
      [GraphNodeMode.ExpandChildren]: this.getIconUri('stack.svg'),
      [GraphNodeMode.ExpandSubgraph]: this.getIconUri('listItem.svg'),
    };
    const statsIconUris = {
      nTreeContexts: this.getIconUri('nTreeContextsStats.svg'),
      nTreeStaticContext: this.getIconUri('nTreeStaticContextsStats.svg'),
      nTreeFileCalled: this.getIconUri('document.svg'),
      nTreeTraces: this.getIconUri('circuit.svg'),
    };
    return {
      themeMode,
      contextNodeIconUris,
      statsIconUris,
      screenshotMode,
    };
  }

  shared() {
    return {
      context: {
        graphDocument: this,
        themeMode: this.state.themeMode,
        contextNodeIconUris: this.state.contextNodeIconUris,
        statsIconUris: this.state.statsIconUris,
        screenshotMode: this.state.screenshotMode
      }
    };
  }
}

export default GraphDocument;