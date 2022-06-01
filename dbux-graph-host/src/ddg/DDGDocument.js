// import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import NanoEvents from 'nanoevents';
import traceSelection from '@dbux/data/src/traceSelection/index';
import DDGSummaryMode from '@dbux/data/src/ddg/DDGSummaryMode';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
// import allApplications from '@dbux/data/src/applications/allApplications';

const lastTraceInfo = {};

export default class DDGDocument extends HostComponentEndpoint {
  get ddg() {
    return this.hostOnlyState.ddg;
  }
  
  // ###########################################################################
  // init
  // ###########################################################################

  init() {
    this._emitter = new NanoEvents();
    // this.state.layoutType = LayoutAlgorithmType.ForceLayout;
    this.state.connectedOnlyMode = true;
    this.state.mergeComputesMode = true;

    this.createOwnComponents();

    // this.addDisposable(traceSelection.onTraceSelectionChanged(() => {
    //   const trace = traceSelection.selected;
    //   if (trace && trace.applicationId !== lastTraceInfo.applicationId /* && trace.contextId !== lastTraceInfo.contextId */) {
    //     // don't refresh when selecting different traces
    //     lastTraceInfo.applicationId = trace.applicationId;
    //     lastTraceInfo.contextId = trace.contextId;
    //     this.timelineView.refresh();
    //   }
    // }));
    // // this.addDisposable(allApplications.selection.onApplicationsChanged(() => {
    // //   this.timelineView.refresh();
    // // }));
    // const trace = traceSelection.selected;
    // // don't refresh when selecting different traces
    // lastTraceInfo.applicationId = trace?.applicationId;
    // lastTraceInfo.contextId = trace?.contextId;
    // this.timelineView.refresh();
  }

  update() {
    this.forceUpdateTree();
  }

  createOwnComponents() {
    this.timelineView = this.children.createComponent('DDGTimelineView');
    this.toolbar = this.children.createComponent('Toolbar');
  }

  /** ###########################################################################
   * DocumentMode
   * ##########################################################################*/

  /**
   * future-work: move this code to a shared location
   */
  setDocumentMode(update) {
    const actualUpdate = {};
    for (const [key, val] of Object.entries(update)) {
      if (this.state[key] !== val) {
        actualUpdate[key] = val;
      }
    }
    if (Object.keys(actualUpdate).length) {
      this.setState(actualUpdate);
      for (const [key, val] of Object.entries(actualUpdate)) {
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

  onMergeComputesModeChanged(cb) {
    return this._emitter.on('mergeComputesModeChanged', cb);
  }

  /** ###########################################################################
   * util
   *  #########################################################################*/

  /**
   * future-work: move this to a shared location
   */
  getIconUri(fileName, modeName = null) {
    if (!fileName) {
      return null;
    }
    if (!modeName) {
      const themeMode = this.componentManager.externals.getThemeMode();
      modeName = ThemeMode.getName(themeMode).toLowerCase();
    }
    return this.componentManager.externals.getClientResourceUri(`${modeName}/${fileName}`);
  }

  // ###########################################################################
  // state + context
  // ###########################################################################

  makeInitialState(state) {
    const summaryIconUris = {
      // [DDGSummaryMode.Hide]: this.getIconUri('hide.svg'),
      [DDGSummaryMode.Collapse]: this.getIconUri('minus.svg'),
      [DDGSummaryMode.ExpandSelf]: this.getIconUri('stack.svg'),
      [DDGSummaryMode.ExpandSubgraph]: this.getIconUri('listItem.svg'),
      // [DDGSummaryMode.HideChildren]: this.getIconUri('hide-children.svg'),
    };
    return {
      themeMode: this.componentManager.externals.getThemeMode(),
      summaryIconUris,

      ...state
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
