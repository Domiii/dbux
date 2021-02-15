import Query from './Query';

/**
 * Represents all queries of a `DataProvider`
 */
export default class Queries {
  _queryNames = [];
  _queries = {};

  /**
   * @param {*} dp 
   * @param {Query} query 
   */
  _addQuery(dp, query) {
    this._queryNames.push(query.name);
    this._queries[query.name] = query;

    query._init(dp);
    this[query.name] = {
      run: query.executor.bind(query, dp), // query all
      // TODO: incremental queries
      // TODO: query listeners
    };
  }
}