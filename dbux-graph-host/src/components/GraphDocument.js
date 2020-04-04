import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
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
    this.toolbar = this.children.create(Toolbar);
  }


  // ###########################################################################
  // reset
  // ###########################################################################

  reset = () => {
    // TODO: add to children
    this.root = GraphRoot.create({ applicationId });
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