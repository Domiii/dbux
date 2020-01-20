import Query from './Query';

/**
 * Represents all queries of a `DataProvider`
 */
export default class Queries {
  _queryNames = [];
  _queries = {};

  _addQuery(dp, query: Query) {
    this._queryNames.push(query.name);
    this._queries[query.name] = query;

    query._init(dp);
    this[query.name] = query.executor.bind(query, dp);
  }

}