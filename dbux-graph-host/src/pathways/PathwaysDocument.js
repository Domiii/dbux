import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import PathwaysView from './PathwaysView';
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

    const {
      onPracticeSessionChanged,
      getPathwaysDataProvider
    } = this.componentManager.externals;

    // listen to pathways data changes
    this.addDisposable(onPracticeSessionChanged(() => {
      // stop listening on previous events
      this.userActionsListener?.();

      // register new event handler
      const pdp = getPathwaysDataProvider();
      this.addDisposable(
        this.userActionsListener = 
          // pathwaysDataProvider.onAnyData(this.view.refresh)
          pdp.onData('userActions', this.view.refresh)
      );

      this.view.refresh();
    }));

    // register event listeners
    // this.addDisposable(
    //   allApplications.selection.onApplicationsChanged(() => {
    //     this.graphRoot.refresh();
    //   })
    // );
    
    this.view.refresh();
  }

  createOwnComponents() {
    this.toolbar = this.children.createComponent(Toolbar);
    this.view = this.children.createComponent(PathwaysView);
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