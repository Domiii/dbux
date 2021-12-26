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
    
    const q = this[query.name] = query.executor.bind(query, dp);
    if (query.getAll) {
      q.getAll = query.getAll.bind(query);
    }
    dp.queryImpl[query.name] = query;
    // {
    //   run: query.executor.bind(query, dp), // query all
    //   // TODO: incremental queries
    //   // TODO: query listeners
    // };
  }
}