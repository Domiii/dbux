import PathwaysMode from '@dbux/data/src/pathways/PathwaysMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import PathwaysView from './PathwaysView';
// import GraphRoot from './GraphRoot';
import Toolbar from './Toolbar';

class PathwaysDocument extends HostComponentEndpoint {
  toolbar;
  // minimap;

  isAnalyzing = () => {
    return PathwaysMode.is.Analyze(this.state.pathwaysMode);
  }

  update() {
    this.toolbar.forceUpdate();
  }

  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this.state.pathwaysMode = PathwaysMode.Normal;

    this.createOwnComponents();

    const {
      onPracticeSessionChanged
    } = this.componentManager.externals;

    // listen to pathways data changes
    this._addHooks();
    this.addDisposable(onPracticeSessionChanged(this._addHooks));
  }

  _addHooks = () => {
    const {
      getPathwaysDataProvider
    } = this.componentManager.externals;

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
        doc: this,
        themeMode: this.state.themeMode,
        analyzing: this.isAnalyzing
      }
    };
  }

  public = {
    async cyclePathwaysMode() {
      // remove all existing children
      this.view.reset();

      // set new mode + initialize new stuff
      const mode = PathwaysMode.nextValue(this.state.pathwaysMode);
      this.setState({
        pathwaysMode: mode
      });

      // switch (mode) {
      //   case PathwaysMode.Analyze:
      //     await this.componentManager.externals.decorateVisitedTraces();
      //     break;
      //   default:
      //     await this.componentManager.externals.stopDecorating();
      //     break;
      // }

      this.view.refresh();
    }
  };
}

export default PathwaysDocument;