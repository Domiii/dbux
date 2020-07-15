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
        this.controllers.getComponent(HighlightManager).clearDisposedHighlighter();
      })
    );
  }

  createOwnComponents() {
    this.controllers.createComponent(HighlightManager);
    this.graphRoot = this.children.createComponent(GraphRoot);
    this.toolbar = this.children.createComponent(Toolbar);
    // this.minimap = this.children.createComponent(MiniMap);
  }

  // ###########################################################################
  // shared
  // ###########################################################################

  shared() {
    return {
      context: {
        graphDocument: this
      }
    };
  }
}

export default GraphDocument;