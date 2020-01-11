import Collection from 'dbux-data/src/Collection';

export class ExecutionContextCollection extends Collection {
  /**
   * @type {DataProvider}
   */
  _dp;
  _contexts = [null];

  constructor(dp) {
    super();
    this._dp = dp;
  }

  getById(contextId) {
    return this._contexts[contextId];
  }


  getStaticContext(contextId) {
    const context = this.getContext(contextId);
    const {
      staticContextId
    } = context;
    return this._dp.staticContextCollection.getById(staticContextId);
  }
}