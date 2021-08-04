import NanoEvents from 'nanoevents';
import allApplications from '@dbux/data/src/applications/allApplications';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HighlightManager from './controllers/HighlightManager';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';
import AsyncGraph from './asyncGraph/AsyncGraph';
import PopperManager from './controllers/PopperManager';

class GraphDocument extends HostComponentEndpoint {
  toolbar;
  // minimap;

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this._emitter = new NanoEvents();
    this.state.asyncGraphMode = true;

    this.createOwnComponents();
    // register event listeners
    this.addDisposable(
      allApplications.selection.onApplicationsChanged(() => {
        this.graphRoot.updateRunNodes();
      })
    );
  }

  createOwnComponents() {
    this.controllers.createComponent(PopperManager);
    this.controllers.createComponent(HighlightManager);
    this.controllers.createComponent('ZoomBar');
    this.asyncGraph = this.children.createComponent(AsyncGraph);
    this.graphRoot = this.children.createComponent(GraphRoot);
    this.toolbar = this.children.createComponent(Toolbar);
    // this.minimap = this.children.createComponent(MiniMap);
  }

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
  // async graph mode
  // ###########################################################################

  get asyncGraphMode() {
    return this.state.asyncGraphMode;
  }

  setAsyncGraphMode(mode) {
    if (this.asyncGraphMode !== mode) {
      this.setState({ asyncGraphMode: mode });
      this.asyncGraph.refresh();
      this.graphRoot.updateRunNodes();
      this._emitter.emit('asyncGraphModeChanged', mode);
    }
  }

  onAsyncGraphModeChanged(cb) {
    return this._emitter.on('asyncGraphModeChanged', cb);
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