import allApplications from 'dbux-data/src/applications/allApplications';
import HighlightManager from './controllers/HighlightManager';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';
import TraceMode from './TraceMode';
// import FocusController from './controllers/FocusController';
// import HighlightManager from './controllers/HighlightManager';

class GraphDocument extends HostComponentEndpoint {
  toolbar;
  // minimap;

  /**
   * @type {GraphRoot}
   */
  root;

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this.traceMode = TraceMode.ContextOnly;

    this.createOwnComponents();

    // ########################################
    // register event listeners
    // ########################################

    allApplications.selection.onApplicationsChanged(this.handleApplicationsChanged);
  }

  createOwnComponents() {
    const traceModeName = TraceMode.getName(this.traceMode);

    this.controllers.createComponent(HighlightManager);
    // this.controllers.createComponent(FocusController);
    this.root = this.children.createComponent(GraphRoot);
    this.toolbar = this.children.createComponent(Toolbar, { traceModeName });
    // this.minimap = this.children.createComponent(MiniMap);

    // start rendering empty graph
    // this.root.refresh();
  }


  // ###########################################################################
  // OnApplicationsChanged
  // ###########################################################################

  handleApplicationsChanged = (selectedApps) => {
    this.refreshGraphRoot();
  }

  // ###########################################################################
  // manage children
  // ###########################################################################

  addContexts = (applicationId, contexts) => {
    this.root.addContexts(applicationId, contexts);
  }

  // ###########################################################################
  // public controller method
  // ###########################################################################

  switchTraceMode() {
    // const nextMode = (this.traceMode + 1) % TraceMode.getCount();
    this.traceMode = TraceMode.nextValue(this.traceMode);

    this.refreshGraphRoot();
    this.toolbar.setState({
      traceModeName: TraceMode.getName(this.traceMode)
    });
  }

  getTraceMode() {
    return TraceMode.getName(this.traceMode);
  }

  refreshGraphRoot() {
    this.root.clear();

    // update root application data
    this.root.refresh();

    // add already existing children contexts
    const selectedApps = allApplications.selection.getAll();
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