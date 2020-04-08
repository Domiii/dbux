import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';

class GraphDocument extends HostComponentEndpoint {
  toolbar;
  /**
   * @type {GraphRoot}
   */
  root;

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this.initChildren();

    // ########################################
    // register event listeners
    // ########################################

    allApplications.selection.onApplicationsChanged(this.handleApplicationsChanged);
  }

  initChildren() {
    this.toolbar = this.children.createComponent(Toolbar);
    this.root = this.children.createComponent(GraphRoot);

    // start rendering empty graph
    this.root.refresh();
  }


  // ###########################################################################
  // OnApplicationsChanged
  // ###########################################################################

  handleApplicationsChanged = (selectedApps) => {
    // update root application data
    this.root.refresh();
    this.root.children.clear();

    for (const app of selectedApps) {
      const { applicationId } = app;

      // add existing contexts
      const { dataProvider } = app;
      this.addContexts(applicationId, dataProvider.collections.executionContexts.getAll());

      // add data listeners
      allApplications.selection.subscribe(
        app.dataProvider.onData('executionContexts',
          contexts => {
            // update root application data (since initially, application name is not available)
            this.root.refresh();
            this.addContexts(applicationId, contexts);
          }
        )
      );
    }
  }

  // ###########################################################################
  // manage children
  // ###########################################################################

  addContexts = (applicationId, contexts) => {
    this.root.addContexts(applicationId, contexts);
  }
}

export default GraphDocument;