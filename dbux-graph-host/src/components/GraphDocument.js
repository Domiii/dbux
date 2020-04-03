import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../HostComponentEndpoint';
import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';

class GraphDocument extends HostComponentEndpoint {
  toolbar;
  root;

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this.initRender();

    // ########################################
    // register event listeners
    // ########################################

    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.reset();

      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('executionContexts', this.addContexts)
        );
      }
    });
  }

  initRender() {
    // TODO: add to children
    this.toolbar = Toolbar.create();
  }


  // ###########################################################################
  // reset
  // ###########################################################################

  reset = () => {
    // TODO: add to children
    this.root = GraphRoot.create();
  }


  // ###########################################################################
  // manage children
  // ###########################################################################

  addContexts = (contexts) => {
    // TODO: handle dynamic child list, and named children both consistently
    this.root.addContexts(contexts);
  }
}

export default GraphDocument;