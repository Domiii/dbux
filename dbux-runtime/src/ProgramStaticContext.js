import StaticContext from './StaticContext';

export default class ProgramStaticContext {
  _programId;

  constructor(programId, { filename, staticSites }) {
    this._programId = programId;
    this._filename = filename;
    this._staticContexts = staticSites.map(
      (siteData) => new StaticContext(programId, siteData)
    );
  }

  getProgramId() {
    return this._programId;
  }
}