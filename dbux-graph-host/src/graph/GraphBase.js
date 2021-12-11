import allApplications from '@dbux/data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

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

  // ###########################################################################
  // getters
  // ###########################################################################

  get highlightManager() {
    return this.parent.controllers.getComponent('HighlightManager');
  }

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