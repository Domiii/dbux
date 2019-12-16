import StaticContext from '../StaticContext';
import { logError } from '../../log/logger';

function makeDefaultStaticContext(programId) {
  const defaultSiteData = {
    // nothing in here
  };
  return new StaticContext(programId, defaultSiteData);
}

export default class ProgramStaticContext {
  _programId;

  constructor(programId, { filename, staticSites }) {
    this._programId = programId;
    this._filename = filename;

    const maxId = Math.max(...staticSites.map(s => s.staticId));
    this._staticContexts = new Array(maxId);
    this._staticContexts[0] = makeDefaultStaticContext();
    for (const siteData of staticSites) {
      this._staticContexts[siteData.staticId] = new StaticContext(programId, siteData);
    }
  }

  getProgramId() {
    return this._programId;
  }

  /**
   * @return {StaticContext}
   */
  getStaticContext(staticId) {
    const site = this._staticContexts[staticId];
    if (!site) {
      logError('ProgramStaticContext.getStaticContext could not find context:', staticId);
      return this._staticContexts[0];
    }
    return site;
  }
}