import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
// import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';

class PathwaysDocument extends HostComponentEndpoint {
  toolbar;
  // minimap;

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this.createOwnComponents();

    // register event listeners
    // this.addDisposable(
    //   allApplications.selection.onApplicationsChanged(() => {
    //     this.graphRoot.refresh();
    //   })
    // );
  }

  createOwnComponents() {
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
    return {
      context: {
        pathwaysDocument: this,
        themeMode: this.state.themeMode
      }
    };
  }
}

export default PathwaysDocument;