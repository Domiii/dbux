// import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import NanoEvents from 'nanoevents';
// import traceSelection from '@dbux/data/src/traceSelection/index';
import LayoutAlgorithmType from '@dbux/graph-common/src/ddg/types/LayoutAlgorithmType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

export default class DDGDocument extends HostComponentEndpoint {
  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this._emitter = new NanoEvents();
    this.state.layoutType = LayoutAlgorithmType.ForceLayout;

    this.createOwnComponents();

    // this.addDisposable(traceSelection.onTraceSelectionChanged(() => {
    //   this.timelineView.refresh();
    // }));
    this.timelineView.refresh();
  }

  update() {
    this.forceUpdateTree();
  }

  createOwnComponents() {
    this.timelineView = this.children.createComponent('DDGTimelineView');
    this.toolbar = this.children.createComponent('Toolbar');
  }

  setDocumentMode(update) {
    const actualUpdate = {};
    for (const [key, val] of Object.entries(update)) {
      if (this.state[key] !== val) {
        actualUpdate[key] = val;
      }
    }
    if (Object.keys(actualUpdate).length) {
      this.setState(actualUpdate);
      for (const [key, val] of Object.entries(update)) {
        this._notifyGraphDocumentModeChanged(key, val);
      }
      return true;
      // this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphGraphDocumentModeChanged, actualUpdate);
    }
    return false;
  }

  _notifyGraphDocumentModeChanged(modeName, value) {
    this._emitter.emit(`${modeName}Changed`, value);
  }

  // /** ###########################################################################
  //  * util
  //  *  #########################################################################*/

  // getIconUri(fileName, modeName = null) {
  //   if (!fileName) {
  //     return null;
  //   }
  //   if (!modeName) {
  //     const themeMode = this.componentManager.externals.getThemeMode();
  //     modeName = ThemeMode.getName(themeMode).toLowerCase();
  //   }
  //   return this.componentManager.externals.getClientResourceUri(`${modeName}/${fileName}`);
  // }

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
        doc: this
      }
    };
  }

  public = {

  };
}
