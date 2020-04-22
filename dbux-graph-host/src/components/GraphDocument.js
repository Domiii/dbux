import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';
import TraceMode from './TraceMode';
import MiniMap from './MiniMap';

class GraphDocument extends HostComponentEndpoint {
  toolbar;
  minimap;
  /**
   * @type {GraphRoot}
   */
  root;

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this.componentManager.doc = this;
    this.traceMode = TraceMode.AllTraces;
    
    this.initChildren();

    // ########################################
    // register event listeners
    // ########################################

    allApplications.selection.onApplicationsChanged(this.handleApplicationsChanged);
  }

  initChildren() {
    const traceModeName = TraceMode.getName(this.traceMode);
    this.toolbar = this.children.createComponent(Toolbar, { traceModeName });
    this.root = this.children.createComponent(GraphRoot);
    this.minimap = this.children.createComponent(MiniMap);

    // start rendering empty graph
    this.root.refresh();
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
    const nextMode = (this.traceMode + 1) % TraceMode.getCount();
    this.traceMode = nextMode;
    this.refreshGraphRoot();
    this.toolbar.setState({ traceModeName: TraceMode.getName(this.traceMode) });
  }

  getTraceMode() {
    return TraceMode.getName(this.traceMode);
  }

  refreshGraphRoot() {
    // update root application data
    this.root.refresh();

    // update children contexts
    this.root.children.clear();
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
}

export default GraphDocument;