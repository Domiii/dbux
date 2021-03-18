import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import allApplications from '@dbux/data/src/applications/allApplications';
import HighlightManager from './controllers/HighlightManager';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';

class GraphDocument extends HostComponentEndpoint {
  toolbar;
  // minimap;

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this.createOwnComponents();

    // register event listeners
    this.addDisposable(
      allApplications.selection.onApplicationsChanged(() => {
        this.graphRoot.refresh();
      })
    );
  }

  createOwnComponents() {
    this.controllers.createComponent(HighlightManager);
    this.graphRoot = this.children.createComponent(GraphRoot);
    this.toolbar = this.children.createComponent(Toolbar);
    // this.minimap = this.children.createComponent(MiniMap);
  }

  getIconUri(modeName, fileName) {
    return this.componentManager.externals.getClientResourceUri(`${modeName}/${fileName}`);
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
        contextNodeIconUris: this.state.contextNodeIconUris,
        statsEnabled: true // TODO: use Toolbar to control, and save to cache instead
      }
    };
  }
}

export default GraphDocument;