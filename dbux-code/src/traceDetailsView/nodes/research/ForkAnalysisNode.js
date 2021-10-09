import { makeDebounce } from '@dbux/common/src/util/scheduling';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import { isFunction } from 'lodash';
import { TreeItemCollapsibleState } from 'vscode';
import TraceDetailNode from '../traceDetailNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/**
 * Manage annotations of all forks. Store them to a JSON file.
 */
class ForkAnnotationController {
  constructor() {

  }

  getAllForks() {
    // TODO
  }

  getForkData(fork) {
    // TODO
  }

  setForkData(fork, data) {
    // TODO
  }

  /** ###########################################################################
   * application events
   * ##########################################################################*/

  refresh = () => {
    this.treeDataProvider.refresh();
  }

  refreshOnData = makeDebounce(() => {
    this.refresh();
  }, 100);

  initOnActivate() {
    // add data event handlers
    this.addDisposable(
      allApplications.selection.onApplicationsChanged((selectedApps) => {
        this.refreshOnData();
        for (const app of selectedApps) {
          const unsub = app.dataProvider.onData('asyncEdges', this.refreshOnData);

          allApplications.selection.subscribe(unsub);
          this.addDisposable(unsub);
        }
      }),

      // add traceSelection event handler
      traceSelection.onTraceSelectionChanged((/* selected */) => {
        this.refresh();
      })
    );
  }

  // TODO: move dispose logic to BaseTreeItem

  // ###########################################################################
  // dispose
  // ###########################################################################

  addDisposable(...disps) {
    this._disposables.push(...disps);
  }

  dispose(/* silent = false */) {
    const { _disposables } = this;
    this._disposables = [];
    this._isDisposed = true;
    
    _disposables.forEach((disp) => {
      if (isFunction(disp)) {
        disp();
      }
      else {
        disp.dispose();
      }
    });
  }
}

/** ###########################################################################
 * render fork data
 * ##########################################################################*/

export default class ForkAnalysisNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Forks';
  }

  handleCollapsibleStateChanged() {
    if (this.collapsibleState === TreeItemCollapsibleState.Expanded) {
      // expanded
      const controller = this.controller = new ForkAnnotationController();
      controller.initOnActivate();

      // refresh right away
      controller.refresh();
    }
    else {
      // collapsed
      this.controller?.dispose();
      this.controller = null;
    }
  }
}