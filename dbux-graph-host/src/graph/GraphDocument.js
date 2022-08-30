import NanoEvents from 'nanoevents';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import StackMode from '@dbux/graph-common/src/shared/StackMode';
import GraphType, { nextGraphType } from '@dbux/graph-common/src/shared/GraphType';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef {import('./GraphContainer').default} GraphContainer */

const screenshotMode = true;
// const screenshotMode = false;

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
    this.state.statsEnabled = true;

    this.createOwnComponents();

    // NOTE: this will be called immediately
    this.addDisposable(allApplications.selection.onApplicationsChanged(() => {
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

    this.contextFilterManager = this.controllers.createComponent('ContextFilterManager');
  }

  update() {
    // this.toolbar.forceUpdate();
    // this.refreshGraphs();

    this.forceUpdateTree();
  }

  /**
   * @type {GraphContainer[]}
   */
  get containers() {
    return this.children.getComponents('GraphContainer');
  }

  /**
   * Refresh every graphs, including their enabled states and children
   */
  refreshGraphs() {
    this.containers.forEach((container) => {
      // container.clearChildren();  // hackfix: brute-force this
      container.refreshGraph();
    });
  }

  /**
   * Clear and rebuild every enabled graph
   */
  maybeFullResetGraphs() {
    this.containers.forEach((container) => {
      container.maybeFullReset();
    });
  }

  /** ###########################################################################
   * util
   *  #########################################################################*/

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

  setGraphMode(mode) {
    if (this.state.graphMode !== mode) {
      const upd = {
        graphMode: mode
      };
      if (mode === GraphType.AsyncGraph) {
        // TODO: use memento to remember mode per type!
        // disable stats for ACG by default (for now), since there is just not enough space
        upd.statsEnabled = false;
      }
      this.setGraphDocumentMode(upd);
      this.refreshGraphs();
    }
  }

  /** ########################################
   * other modes
   *  ######################################*/

  setGraphDocumentMode(update) {
    const actualUpdate = {};
    for (const [key, val] of Object.entries(update)) {
      if (this.state[key] !== val) {
        actualUpdate[key] = val;
      }
    }
    if (Object.keys(actualUpdate).length) {
      this.setState(actualUpdate);
      for (const [key, val] of Object.entries(update)) {
        this._notifyGraphDocumentModeChanged(key, val);
      }
      this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphGraphDocumentModeChanged, actualUpdate);
    }
  }
  
  _notifyGraphDocumentModeChanged(modeName, value) {
    this._emitter.emit(`${modeName}Changed`, value);
  }

  onFollowModeChanged(cb) {
    return this._emitter.on('followModeChanged', cb);
  }

  // ###########################################################################
  // initial state + shared context
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
      nTreeStaticContexts: this.getIconUri('nTreeStaticContextsStats.svg'),
      nTreeFileCalled: this.getIconUri('document.svg'),
      nTreeTraces: this.getIconUri('circuit.svg'),
      nTreePackages: this.getIconUri('nodejs.svg'),
    };
    const toolbarIconUris = {
      theradSelection: this.getIconUri('filter.svg'),
      contextFilter: this.getIconUri('packageWhitelist.svg'),
    };
    return {
      themeMode,
      contextNodeIconUris,
      statsIconUris,
      toolbarIconUris,
      screenshotMode,
    };
  }

  shared() {
    return {
      /**
       * Non-modular version of react's "context": a type of global state.
       */
      context: {
        graphDocument: this,
        themeMode: this.state.themeMode,
        screenshotMode: this.state.screenshotMode,
      }
    };
  }
}

export default GraphDocument;