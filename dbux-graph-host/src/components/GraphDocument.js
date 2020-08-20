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
        allApplications.selection.incBusy();
        
        this.graphRoot.refresh();

        if (this.componentManager.isBusyInit()) {
          const unbind = this.componentManager.onBusyStateChanged((state) => {
            if (!state) {
              allApplications.selection.decBusy();
              unbind();
            }
          });
        }
        else {
          allApplications.selection.decBusy();
        }
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
  // state + context
  // ###########################################################################

  makeInitialState() {
    return {
      themeMode: this.componentManager.externals.getThemeMode()
    };
  }

  shared() {
    // eslint-disable-next-line no-console
    console.debug('themeMode:', this.state.themeMode);
    return {
      context: {
        graphDocument: this,
        themeMode: this.state.themeMode
      }
    };
  }
}

export default GraphDocument;