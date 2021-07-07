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

  getIconUri(modeName, fileName) {
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
    const themeModeName = ThemeMode.getName(themeMode).toLowerCase();
    const contextNodeIconUris = {
      [GraphNodeMode.Collapsed]: this.getIconUri(themeModeName, 'minus.svg'),
      [GraphNodeMode.ExpandChildren]: this.getIconUri(themeModeName, 'stack.svg'),
      [GraphNodeMode.ExpandSubgraph]: this.getIconUri(themeModeName, 'listItem.svg'),
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