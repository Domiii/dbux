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

    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.resetGraph();

      for (const app of selectedApps) {
        const { applicationId } = app;
        allApplications.selection.subscribe(
          app.dataProvider.onData('executionContexts', 
            contexts => this.addContexts(applicationId, contexts)
          )
        );
      }
    });
  }

  initChildren() {
    this.toolbar = this.children.createComponent(Toolbar);
    this.root = this.children.createComponent(GraphRoot);

    // start rendering empty graph
    this.resetGraph();
  }


  // ###########################################################################
  // reset
  // ###########################################################################

  resetGraph = () => {
    // initialize new root
    const update = {
      applications: allApplications.selection.getAll().map(app => ({
        applicationId: app.applicationId,
        entryPointPath: app.entryPointPath,
        name: app.getFileName()
      }))
    };
    this.root.setState(update);
  }


  // ###########################################################################
  // manage children
  // ###########################################################################

  addContexts = (applicationId, contexts) => {
    this.root.addContexts(applicationId, contexts);
  }
}

export default GraphDocument;