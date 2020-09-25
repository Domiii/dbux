
import merge from 'lodash/merge';
// import { getItem, setItem } from '../util/localStorage';
import NanoEvents from 'nanoevents';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

import State from './State';
import NotLoaded from './NotLoaded';
import { docToSimpleObject } from './firebaseUtil';
// import { logInstrumentAllMethodCalls } from '../util/traceLog';

/** @typedef {import('./db').Db} Db */

const logger = newLogger('FirestoreContainer');

// eslint-disable-next-line no-unused-vars
const { debug, log } = logger;

// const TraceLog = false;


// ###########################################################################
// query util
// ###########################################################################

const snapshotCfg = {
  // listen for offline events as well: https://cloud.google.com/firestore/docs/manage-data/enable-offline
  includeMetadataChanges: true
};

function buildStateUpdate(docId, obj) {
  return { [docId]: obj };
}

// // eslint-disable-next-line camelcase
// function get__data() {
//   return this._data;
// }

function applyTransformsToQuery(query, transforms) {
  // let msg = 'building query...\n\n';
  // debugger;
  for (const t of transforms) {
    if (t) {
      query = t(query);
      // msg = `${msg}\n\n${t}`;
    }
  }
  // console.info(msg);
  return query;
}

function buildQuery(query, queryArgs) {
  const {
    where: whereArgs,
    limit,
    orderBy: orderByArgs,
    transforms
  } = queryArgs;

  // start building query
  if (whereArgs) {
    for (let i = 0; i < whereArgs.length; i += 3) {
      query = query.where(whereArgs[i], whereArgs[i + 1], whereArgs[i + 2]);
    }
  }
  if (transforms) {
    query = applyTransformsToQuery(query, transforms);
  }
  if (orderByArgs) {
    if (Array.isArray(orderByArgs)) {
      query = query.orderBy(...orderByArgs);
    }
    else {
      query = query.orderBy(orderByArgs);
    }
  }

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

class FirestoreContainer {
  /**
   * @type {State}
   */
  state;
  _caching = false;
  /**
   * TODO: get rid of this (it's already stored in this.state)
   */
  docsById = {};
  _docPromisesById = {};

  /**
   * Array of array of docs
   */
  _pages = [];

  // /**
  //  * Store cached (early arriving) items for a page in this temporarily.
  //  */
  // _perPageTmp = [];

  /**
   * Array of snapshots
   */
  _pageSnapshots = [];

  _unsubscribeCallbacks = {};
  _unsubscribeCallbacksArray = [];
  _nextPage = 0;
  _started = false;
  _hasLoaded = false;
  _qualifiedName = null;

  _lastDoc = null;
  _activePromise = null;

  _docsArray = null; // cache

  emitter = new NanoEvents();

  /**
   * 
   * @param {Db} db 
   * @param {String} collectionName 
   * @param {State} state 
   */
  constructor(db, collectionName, state) {
    this.db = db;
    this.collectionName = collectionName;

    this.state = state || new State();

    this.logger = newLogger(`Db.${collectionName}`);

    this._keyName = `dbux.projects.backend.container.${collectionName}`;

    // if (TraceLog) {
    //   logInstrumentAllMethodCalls(`FSC[${collectionName}]`, this);
    // }
  }

  init() {
  }

  // ########################################
  // Getters
  // ########################################

  get collection() {
    return this.db.collection(this.collectionName);
  }

  get name() {
    return this.collectionName;
  }

  get started() {
    return this._started;
  }

  hasLoaded() {
    // has finished loading the first page
    return this._hasLoaded;
  }

  /**
   * TODO: possibly get docs from `_pages` instead of `docsById`
   */
  getNonNullIds() {
    return Object.keys(this.docsById).filter(k => !!this.docsById[k]);
  }

  count() {
    return Object.keys(this.docsById).filter(k => !!this.docsById[k]).length;
  }

  clear() {
    for (const cb of this._unsubscribeCallbacksArray) {
      cb();
    }
    this._activePromise = null;
    this.docsById = {};
    this._docPromisesById = {};
    this._pages = [];
    this._pageSnapshots = [];
    this._docsArray = null;
    this._unsubscribeCallbacks = {};
    this._unsubscribeCallbacksArray = [];
    this._nextPage = 0;
    this._started = false;
    this._hasLoaded = false;
    this._reachedLastPage = false;
    this._lastDoc = null;
    this._queryArgs = null;
    this.state.clear();

    this.emitter.emit('clear');
  }

  getLoadedPageCount() {
    return this._nextPage;
  }

  hasLoadedPage(iPage) {
    return !!this._pages[iPage];
  }

  hasReachedLastPage = () => {
    return this._reachedLastPage;
  }

  /**
   * Builds and caches array of all non-null (simple object representations of) docs.
   * Returns previously build array, if no changes were made in the menatime.
   * 
   * NOTE: Keeps the initial order of documents queried using `query`, `where` etc.
   */
  getAllNotNull = () => {
    if (!this._hasLoaded) {
      return NotLoaded;
    }
    if (!this._docsArray) {
      // cache it
      this._docsArray = this._buildNonNullValuesArray();
    }
    return this._docsArray;
  }

  /**
   * 
   */
  _buildNonNullValuesArray() {
    let arr;
    if (this._pages.length) {
      // if we queried objects one page at a time, get them
      const docs = this._pages.flat();
      arr = docs.map(doc => this.docsById[doc.id]);
    }
    else {
      // get array of all individual objects
      arr = Object.values(this.docsById);
    }
    return arr.filter(simpleDoc => !!simpleDoc);
  }

  getDocById(contentId) {
    return this.docsById[contentId];
  }

  getFirstDoc() {
    if (!this._hasLoaded) {
      return NotLoaded;
    }

    let firstId;
    if (this._pages?.length) {
      const doc = this._pages[0][0];

      // NOTE: currently, there is some inconsistency as to what kind of "doc" is stored in _pages
      firstId = doc?.id || doc?._id || null;
    }
    else {
      for (const docId in this.docsById) {
        firstId = docId;
        break;
      }
    }

    return firstId ? this.docsById[firstId] : NotLoaded;
  }

  /**
   * Contains null values (results of queries that are empty or deleted objects)
   */
  getAllNow = () => {
    if (!this._hasLoaded) {
      return NotLoaded;
    }
    return this.docsById;
  }

  /**
   * Copy of docsById but with null values removed.
   * TODO: possibly use `_pages` instead of `docsById` to maintain order.
   */
  getAllNowNotNull = () => {
    if (!this._hasLoaded) {
      return NotLoaded;
    }
    const notNullDocsById = {};
    for (const key in this.docsById) {
      const value = this.docsById[key];
      if (value !== null) {
        notNullDocsById[key] = value;
      }
    }
    return notNullDocsById;
  }

  getQueryArgs() {
    return this._queryArgs;
  }

  /**
   * Returns the reference to given doc
   */
  doc = docId => {
    // if (!isString(docId) || !docId) {
    //   debugger;
    //   console.error('docId', docId);
    //   throw new Error('invalid docId must be non-empty string: ' + docId);
    // }
    return this.collection.doc(docId);
  }

  newDocRef() {
    return this.collection.doc();
  }

  // ###########################################################################
  // queries
  // ###########################################################################

  /**
   * Send out query to get first page of all documents in collection.
   */
  all = async () => {
    if (this._hasLoaded) {
      return this.getAllNow();
    }
    return this.query(); // `all()` is the same as `query()` with no args
  }

  /**
   * Send out query to get first page of given filter.
   */
  where = async (...whereArgs) => {
    return this._query({
      where: whereArgs,
      limit: undefined
    });
  }

  /**
   * Send out query to get first page of given args.
   */
  async query(queryArgs) {
    return this._query(queryArgs);
  }

  /**
   * Will override current queryArgs.
   * Useful when behavior of query should vary between different pages.
   */
  overrideQueryArgs = (queryArgsOverride) => {
    if (!this._queryArgs) {
      throw new Error('Must call `query()` before calling `nextPage()`!');
    }

    // apply new queryArgs
    const newQueryArgs = merge({}, this._queryArgs, queryArgsOverride);

    if (!(newQueryArgs.limit > 0)) {
      // eslint-disable-next-line max-len
      throw new Error('Tried to call `nextPage()` without having a proper limit set. Make sure to call `query()` instead of `where()`, or pass a limit in your call to `nextPage`!');
    }

    // store result
    this._queryArgs = newQueryArgs;
  }

  async loadNextPage(queryArgsOverride) {
    if (this._reachedLastPage) {
      // already done!
      return null;
    }

    // make sure previous query finished before doing this (so lastDoc is set!)
    await this._activePromise;

    // validate & apply new queryArgs
    this.overrideQueryArgs(queryArgsOverride);

    this.logger.debug('nextPage');

    // run query
    return this._runQuery(false);
  }

  _query = async (queryArgs) => {
    // perfLogCategory('firestoreQuery', '_where', '[START]', queryArgs);

    if (this._started) {
      // eslint-disable-next-line max-len
      throw new Error('[INTERNAL ERROR] cannot call where or all more than once, or after calling getDoc, as it will override most stuff (won\'t override `docsById`). Call `clear()` first.');
    }

    this._queryArgs = queryArgs = queryArgs || EmptyObject;

    const {
      where: whereArgs,
    } = queryArgs;

    if (whereArgs && whereArgs.length % 3 !== 0) {
      throw new Error('[INTERNAL ERROR] Call to `where` must have 3, 6, 9, ... arguments.');
    }

    this._started = true;

    // NOTE: we are not currently using _qualifiedName, and it also might need some partial sorting to actually work correctly
    // this._qualifiedName = `${this.collectionName}.${JSON.stringify(whereArgs || EmptyArray)}`;

    // load from cache for optimistic UI
    this.loadFromCache();

    return this._runQuery(true);
  }

  /**
   * Runs a query to get (and continuously update) pages of docs from collection
   */
  _runQuery = async (isFirstPage) => {
    // perfLogCategory('firestoreQuery', '_runQuery', '[START]', this._queryArgs);
    // console.log('FirestoreContainer', '_runQuery', '[START]', this._queryArgs);
    let query = buildQuery(this.collection, this._queryArgs);

    // add paging
    if (!isFirstPage && this._lastDoc) {
      query = query.startAfter(this._lastDoc);
    }

    const iPage = this._nextPage++;
    // this._perPageTmp[iPage] = null;
    const {
      limit
    } = this._queryArgs;

    await this._activePromise; // prevent race-condition (TODO: find less expensive solution...)

    // send out query
    return this._activePromise = new Promise((resolve, reject) => {
      // perfLogCategory('firestoreQuery', 'query.onSnapshot', '[START]');
      const onSnapshot = snap => {
        let { docs } = snap;

        if (snap.metadata.fromCache) {
          // console.warn('FirestoreContainer.onSnapshot [fromCache]', docs);
          // ignore cached results (for now)
          // see: https://groups.google.com/forum/#!topic/google-cloud-firestore-discuss/wEVPfgvLCFs
          // const tmp = this._perPageTmp[iPage] = this._perPageTmp[iPage] || new Set();
          // docs.forEach(tmp.add.bind(tmp)); // add docs to tmp
          return;
        }
        // console.warn('FirestoreContainer.onSnapshot', docs);

        // if (this._perPageTmp[iPage]) {
        //   // add objects that arrived early from the cache
        //   docs = [
        //     ...this._perPageTmp[iPage],
        //     ...docs
        //   ];
        //   this._perPageTmp[iPage] = null;
        // }


        // perfLogCategory('firestoreQuery', 'query.onSnapshot', '[END]');
        // perfDefault.onSnapshot(snap, this.constructor.name);

        if (isFirstPage) {
          // got some data
          this._hasLoaded = true;

          // only write first page to cache
          this.writeToCache(docs);
        }

        // remember `_lastDoc` and `_reachedLastPage` for paging purposes
        if (iPage === this.getLoadedPageCount() - 1) {
          this._lastDoc = docs[docs.length - 1];
          this._reachedLastPage = docs.length < limit;
        }

        // store result
        const res = this._onDocsUpdate(iPage, docs, snap, false);

        // resolve promise
        if (this._activePromise) {
          this._activePromise = null;
          resolve(res);
        }
      };
      const unsubscribe = query.onSnapshot(snapshotCfg, onSnapshot, this._onError);

      this._unsubscribeCallbacksArray.push(unsubscribe);
    });
  }

  // ########################################
  // synchronization stuff
  // ########################################

  // async _addPromise() {
  //   while (this._activePromise) {
  //     // prevent race-condition (this Container class is very limited; can only cache page at a time anyway)
  //     await this._activePromise;
  //   }


  // }

  // ########################################
  // error handling (if you wanna call this that)
  // ########################################

  _onError = (err) => {
    this.logger.warn('onSnapshot failed -', err);
    debugger;
    this.clear();
  }

  // // ########################################
  // // caching
  // // ########################################

  // enableCache() {
  //   this._caching = true;
  // }

  // loadFromCache = () => {
  //   if (!this._caching) {
  //     return;
  //   }
  //   if (!this._qualifiedName) {
  //     throw new Error('Cannot load from cache before call to all() or where()');
  //   }
  //   const cachedDocs = getItem(this._qualifiedName);
  //   if (cachedDocs) {
  //     this._hasLoaded = true;
  //     this._started = true;
  //     cachedDocs.forEach(d => d.data = get__data);
  //     this.overrideDocs(cachedDocs);
  //   }
  // }

  // writeToCache = (docsArray) => {
  //   if (!this._caching) {
  //     return;
  //   }
  //   if (!this._qualifiedName) {
  //     throw new Error('Cannot write to cache before call to all() or where()');
  //   }
  //   const serialized = docsArray.map(d => ({
  //     id: d.id,
  //     _data: d.data()
  //   }));
  //   setItem(this._qualifiedName, serialized);
  // }

  // ########################################
  // overrides
  // ########################################

  /**
   * apply the given update to doc of given docId
   */
  overrideDoc = (docId, newData, shouldMerge = true) => {
    if (shouldMerge) {
      newData = newData === null ? null : { 
        ...(this.docsById[docId]), 
        ...newData
      };
    }
    this._onDocUpdate(docId, newData, true);
  }

  overrideDocs = (docsArray) => {
    // TODO: can only override first page for now
    // TODO: docsArray is mostly assumed to be an array of FirestoreDocs, not of replacement objects; will bug out eventually
    this._onDocsUpdate(0, docsArray, null, true);
  }


  // ########################################
  // events
  // ########################################

  /**
   * Register a listener to be called on updates for given doc.
   * `listener` is called with the doc's data as first argument.
   */
  addListener(docId, listener) {
    return this.state.addListener(docId, listener);
  }

  /**
   * Register a listener to be called on any update.
   * `listener` is called with an object representing the changed page.
   */
  onUpdate = (listener) => {
    return this.state.onUpdate(listener);
  }

  // ########################################
  // querying
  // ########################################

  getDocNowOrQuery = docId => {
    const result = this.docsById[docId];
    if (result === NotLoaded) {
      this.queryDoc(docId); // register listener
    }

    // TODO: should not need docsById, state should be enough;
    //         but in some instances we are sharing the same state for multiple...
    //          Fix: use a global "FLUX-like" "scheduler" system, instead of having each state use it's own "scheduler"
    return result;
  }

  onDoc = (docId, cb) => {
    this.queryDoc(docId);
    this.onUpdate(changed => {
      if (docId in changed) {
        cb(docId);
      }
    });
  }

  /**
   * Registers snapshot listener (if not listening already) on given doc and returns promise of doc.data().
   */
  queryDoc = async (docId) => {
    this._started = true;

    if (this._docPromisesById[docId]) {
      return await this._docPromisesById[docId];
    }

    return this._docPromisesById[docId] = new Promise((resolve, reject) => {
      // did not query yet -> send out query now
      const onSnapshot = doc => {
        // perfDefault.onSnapshot(doc, this.constructor.name);

        const obj = this._onDocSnapshot(doc);
        resolve(obj);
      };
      const unsubscribe = this.doc(docId).onSnapshot(snapshotCfg,
        onSnapshot,
        err => {
          this._onError(err);
          reject(err);
        }
      );

      this._unsubscribeCallbacks[docId] = unsubscribe;
      this._unsubscribeCallbacksArray.push(unsubscribe);
    });
  }

  async queryDocs(ids) {
    return Promise.all(ids.map(id => this.queryDoc(id)));
  }

  stopListen(docId) {
    const unsubscribe = this._unsubscribeCallbacks[docId];
    if (unsubscribe) {
      // TODO: 
      //    1. call this._unsubscribeCallbacks[docId]()
      //    2. remove corresponding listeners from state as well?
      // unsubscribe();
      // if (!this._emitter.getListenerCount()) {
      //   // no one interested anymore -> stop listening for this content item
      //   // delete from cache and fully unsubscribe after a minute
      //   setTimeout(() => {
      //     if (!this._emitter.getListenerCount()) {
      //       this._unsubscribeCallbacks[contentId]();
      //       delete this._unsubscribeCallbacks[contentId];
      //       delete this.docsById[contentId];
      //     }
      //   }, 60 * 1000);
      // }
    }
  }

  // ###########################################################################
  // write docs
  // ###########################################################################

  async addDoc(data) {
    const docRef = this.newDocRef();
    return this.setDoc(docRef.id, data);
  }

  /**
   * NOTE: Currently does not support merging
   */
  async setDoc(docId, upd) {
    // const data = this.getDocById(docId);
    // if (data !== NotLoaded) {
    const shouldMerge = false;
    this.overrideDoc(docId, upd, shouldMerge);
    // }
    // await this.doc(docId).set(upd);
    await this.db.write(this, docId, upd);

    // NOTE: returned object has _id prop fused in with `data` (see `_registerDoc`)
    return this.getDocById(docId);
  }

  deleteDoc(docId) {
    this.overrideDoc(docId, null, false);
    return this.doc(docId).delete();
  }

  // ########################################################################
  // private methods
  // ########################################################################

  _onDocSnapshot = (doc) => {
    return this._onDocUpdate(doc.id, doc.data() || null);
  }

  _registerDoc(docId, docData) {
    if (docData !== null && docData !== undefined) {
      docData = docToSimpleObject(docId, docData);
    }
    // if (docData === null) {
    //   delete this.docsById[docId];
    // }
    // else 
    this.docsById[docId] = docData;
  }

  _onDocUpdate = (docId, newData, isOverride = false) => {
    // commit changes
    this._hasLoaded = true;
    const oldData = this.docsById[docId];

    this._registerDoc(docId, newData);

    // fix-up page array
    for (let i = 0; i < this._pages?.length; ++i) {
      const page = this._pages[i];
      if (page.find(d => d.id === docId)) {
        this._pages[i] = this._pages[i].filter(d => d.id !== docId);
        break;
      }
    }

    // console.warn('[FirestoreContainer update]', docId, newData);

    // hooks
    if (this.onBeforeDocUpdateCb) {
      this.onBeforeDocUpdateCb(this, docId, newData, oldData, isOverride);
    }
    if (this.onBeforePageUpdateCb) {
      this.onBeforePageUpdateCb(this, null, null, isOverride, null);
    }

    this._setState(docId, newData);

    this.emitter.emit('update');

    return newData;
  }


  _onDocsUpdate = (iPage, addedOrModifiedDocsArray, snapshot, isOverride = false) => {
    // clear cache
    this._docsArray = null;

    // determine whether this is the first time we receive data for this page
    const isFirstTimeForThisPage = !this._pages[iPage];

    // set all old docs to null (TODO: better manage deleted docs)
    const missingIds = new Set();
    const oldPageDocs = this._pages[iPage];
    if (oldPageDocs) {
      for (const doc of oldPageDocs) {
        missingIds.add(doc.id);
      }
    }

    // store in page array
    this._pages[iPage] = addedOrModifiedDocsArray;
    this._pageSnapshots[iPage] = snapshot;

    // TODO: properly commit snapshot.docChanges() (if `snapshot` is not null)

    // commit changes
    const upd = {};
    for (const doc of addedOrModifiedDocsArray) {
      const docId = doc.id;
      const newData = doc.data();
      const oldData = this.docsById[docId];
      missingIds.delete(docId);
      // if (newData) {
      this._registerDoc(docId, newData);
      // }

      upd[docId] = newData; // new state update

      if (this.onBeforeDocUpdateCb) {
        // WARNING: If this hook triggers successive render calls, it might render stale data, since not all data has been committed yet.
        this.onBeforeDocUpdateCb(this, docId, newData, oldData, isOverride);
      }
    }

    // handle deletions
    for (const missingId of missingIds) {
      if (this.onBeforeDocUpdateCb) {
        this.onBeforeDocUpdateCb(this, missingId, null, this.docsById[missingId], isOverride);
      }
      // this doc was around before but has been deleted
      this.docsById[missingId] = null;
    }
    // console.warn('[FirestoreContainer._onDocsUpdate]', docId, newData);

    // hooks
    if (this.onBeforePageUpdateCb) {
      this.onBeforePageUpdateCb(this, iPage, snapshot, isOverride, isFirstTimeForThisPage);
    }

    // setState
    this.state.setState(upd);

    this.emitter.emit('update');

    return upd;
  }

  _setState = (docId, obj) => {
    this.state.setState(buildStateUpdate(docId, obj));
  }
}

export default FirestoreContainer;