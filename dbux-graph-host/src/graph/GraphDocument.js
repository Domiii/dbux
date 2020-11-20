import NanoEvents from 'nanoevents';
import HighlightManager from './controllers/HighlightManager';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';
import AsyncGraph from './asyncGraph/AsyncGraph';

class GraphDocument extends HostComponentEndpoint {
  toolbar;
  // minimap;

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this._emitter = new NanoEvents();
    this.state.asyncGraphMode = false;

    this.createOwnComponents();
  }

  createOwnComponents() {
    this.controllers.createComponent(HighlightManager);
    this.asyncGraph = this.children.createComponent(AsyncGraph);
    this.graphRoot = this.children.createComponent(GraphRoot);
    this.toolbar = this.children.createComponent(Toolbar);
    // this.minimap = this.children.createComponent(MiniMap);
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
    return {
      themeMode: this.componentManager.externals.getThemeMode()
    };
  }

  shared() {
    return {
      context: {
        graphDocument: this,
        themeMode: this.state.themeMode
      }
    };
  }
}

export default GraphDocument;