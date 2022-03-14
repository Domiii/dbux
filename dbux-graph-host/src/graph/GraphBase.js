import sleep from '@dbux/common/src/util/sleep';
import allApplications from '@dbux/data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("./controllers/FocusController").default } FocusController */
/** @typedef { import("./controllers/HighlightManager").default } HighlightManager */

/**
 * Template class of `Graph`s, child of `GraphConatiner`
 */
class GraphBase extends HostComponentEndpoint {
  handleRefresh() {
    throw new Error('abstract method not implemented');
  }

  clear() {
    throw new Error('abstract method not implemented');
  }

  shouldBeEnabled() {
    throw new Error('abstract method not implemented');
  }

  _resetPromise;
  fullReset() {
    if (!this._resetPromise) {
      this._resetPromise = (async () => {
        try {
          await sleep(50); // implicit debounce
          await this.waitForAll();
          this.clear();
          await this.waitForClear();
          this.refresh();
          await this.waitForAll();
        }
        finally {
          this._resetPromise = null;
        }
      })();
    }
    return this._resetPromise;
  }

  waitForReset() {
    return this._resetPromise;
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  /**
   * @type {HighlightManager}
   */
  get highlightManager() {
    return this.parent.controllers.getComponent('HighlightManager');
  }

  /**
   * @type {FocusController}
   */
  get focusController() {
    return this.parent.controllers.getComponent('FocusController');
  }

  /** ###########################################################################
   * helpers
   *  #########################################################################*/

  makeApplicationState(apps = allApplications.selection.getAll()) {
    const applications = apps.map(app => ({
      applicationId: app.applicationId,
      entryPointPath: app.entryPointPath,
      name: app.getPreferredName()
    }));
    return applications;
  }
}

export default GraphBase;