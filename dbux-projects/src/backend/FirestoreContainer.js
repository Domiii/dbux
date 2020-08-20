import zipObject from 'lodash/zipObject';
import mapValues from 'lodash/mapValues';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';

import Firebase from 'firebase/app';
import db from './db';
import NotLoaded from './NotLoaded';

import loadedValue from './loadedValue';

const MergeTrue = Object.freeze({ merge: true });
const EmptyArray = Object.freeze([]);
const EmptyObject = Object.freeze({});

export default class FirestoreContainer {
  SelectorFunctions = {
    // this.constructor.loadFromIds(cohortIds, 'cohortId', this.getCohort, )
    loadFromIds(ids, idName, getById) {
      ids = ids || EmptyArray;

      let entries = ids.map(id => getById(id));
      if (entries.some(cohort => cohort === NotLoaded)) {
        // not done yet
        return NotLoaded;
      }

      return entries.map((obj, i) => (
        { [idName]: ids[i], ...obj }
      ));
    }
  };

  get _defaultQueries() {
    return {
      byId: {
        query: this.doc,
        map: snap => snap.data()
      }
    };
  }
  _registered = new Map();

  constructor() {
    // setup initial state
    //console.warn(this.constructor.initialState);
    this.state = {
      _state: true,
      ...this.constructor.initialState
    };

    setTimeout(() => {
      // make sure, no one accidentally overrides this.state
      if (!this.state._state) {
        throw new Error(this.constructor.n + ': this.state has been overwritten. Make sure not to set state as a class variable in a FirebaseContainer class.');
      }

      // make sure, no one accidentally sets initialState on instance (should either be static or not exist at all)
      if (this.initialState) {
        throw new Error(this.constructor.n + ': Found `initialState` on FirestoreContainer instance, but should be static.');
      }
    });

    let collectionName;
    if (this.constructor.collectionName) {
      collectionName = this.constructor.collectionName;
    }
    else if (this.constructor.n) {
      // collection name is also the default container name
      collectionName = this.constructor.n;
    } else {
      throw new Error('FirestoreContainer must define static property `n` (short for `name`): ' + this.constructor.name);
    }

    this.collectionName = collectionName;
    this.collection = db.collection(collectionName);

    let {
      values,
      queries,
      selectors,
      actions,
      refs
    } = this;

    if (values) {
      this.registerValues(values);
    }

    this.registerQueries(queries);

    if (selectors) {
      // bind to this
      selectors = mapValues(selectors, f => f.bind(this));

      // merge selectors into `state` as well as into `this`
      Object.assign(this.state, selectors);
      Object.assign(this, selectors);
    }

    if (actions) {
      // bind to this
      actions = mapValues(actions, f => f.bind(this));

      // merge actions into `state` as well as into `this`
      Object.assign(this.state, actions);
      Object.assign(this, actions);
    }

    if (refs) {
      // assign the return value of the refs getter as "refs" property
      Object.defineProperty(this, 'refs', { refs });
    }
  }

  get db() {
    return db;
  }

  doc = id => {
    return this.collection.doc(id);
  }

  defaultQueryMap = snap => {
    if (snap instanceof Firebase.firestore.QuerySnapshot) {
      // array of docs
      // https://firebase.google.com/docs/reference/js/firebase.firestore.QuerySnapshot
      return snap.docs;
    }
    else {
      // a single doc's data
      // https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentSnapshot
      return snap.data();
    }
  }

  registerValues = (config) => {
    const _originalState = this.state || {};
    for (let name in config) {
      let cfg = config[name];

      if (cfg.onSnapshot) {
        // cfg instanceof Firebase.firestore.DocumentReference ||
        // cfg instanceof Firebase.firestore.CollectionReference ||
        // cfg instanceof Firebase.firestore.Query
        cfg = {
          ref: cfg
        };
      }

      let {
        ref,
        map: mapFn,
        mergeRoot
      } = config[name];

      if (!ref) {
        throw new Error(`ref was not provided in ${this}.values.${name}`);
      }

      if (mapFn) {
        mapFn = mapFn.bind(this);
      }
      if (mergeRoot) {
        mergeRoot = mergeRoot.bind(this);
      }

      const registration = {
        ref,
        mapFn,
        mergeRoot
      };

      // register
      this._registered.set(name, registration);

      // register a proxy call
      Object.defineProperty(_originalState, name, {
        configurable: true,
        enumerable: true,
        get: () => {
          //console.warn('GET value', name);
          if (registration.unsub) {
            // already registered snapshot listeners
            return registration.value;
          }

          // the first time we access this query, register a listener
          registration.unsub = ref.onSnapshot(async snap => {
            //console.warn('onSnapshot', name, snap.docs && snap.docs.length);
            let result;
            if (mapFn) {
              //const oldState = this.state[name];
              result = loadedValue(await mapFn(snap));
            } else {
              result = snap;
            }

            // set state for given path
            registration.value = result;
            let stateUpd = {
              [name]: result
            };

            if (mergeRoot) {
              // merge back into root
              const res = await mergeRoot(snap, name, ref);
              Object.assign(stateUpd, res);
            }

            //console.warn(stateUpd);

            this.setState(stateUpd);
          });

          // not loaded on first attempt
          return NotLoaded;
        }
      });
    }
    this.state = _originalState;
  }

  registerQueries = config => {
    const _queryStates = {};
    config = {
      ...this._defaultQueries,
      ...config
    };

    for (let name in config) {
      let cfg = config[name];
      //console.log(name, cfg, cfg.query);

      if (isFunction(cfg)) {
        // only provided the query function
        cfg = {
          query: cfg
        };
      }
      else if (cfg.onSnapshot) {
        // cfg instanceof Firebase.firestore.DocumentReference ||
        // cfg instanceof Firebase.firestore.CollectionReference ||
        // cfg instanceof Firebase.firestore.Query) {
        cfg = {
          query: () => cfg
        };
      }


      let {
        query,
        map: mapFn,
        mergeRoot
      } = cfg;

      // make sure, query is a function
      if (!isFunction(query)) {
        throw new Error(`Invalid query entry: ${this}.queries.${name}.query is not (but must be) function - ${query}`);
      }
      query = query.bind(this);

      if (mapFn) {
        mapFn = mapFn.bind(this);
      }
      if (mergeRoot) {
        mergeRoot = mergeRoot.bind(this);
      }

      const registration = {
        name,
        fullName: this.constructor.n + '.queries.' + name,
        query,
        mapFn,
        mergeRoot
      };

      // register
      this._registered.set(name, registration);

      // the actual query will be registered as the queryRead function on the given registration
      const queryFn = this._queryRead.bind(this, registration);
      Object.assign(this, {
        [name]: queryFn
      });
      Object.assign(this.state, {
        [name]: queryFn
      });

      _queryStates[name] = {
        cache: {},
        loadStatus: {}
      };
    }

    Object.assign(this.state, {
      // cache is used by queries
      _queryStates
    });
  }

  _updateQueryCache(name, argsPath, result) {
    this.setState(({
      _queryStates
    }) => {
      const queryState = _queryStates[name];
      queryState.cache[argsPath] = result;
      return {
        _queryStates
      };
    });
  }

  _queryRead = (registration, ...args) => {
    const {
      name,
      query
    } = registration;
    const {
      _queryStates
    } = this.state;

    const {
      fullName,
      mapFn
    } = registration;

    // make sure, args kinda check out.
    args.forEach(arg => {
      if (isObject(arg) || isFunction(arg)) {
        throw new Error(`Invalid call to Firestore query in ${fullName}: arguments must all be primitives: ` + JSON.stringify(args));
      }
    });

    const queryState = _queryStates[name];
    const argsPath = JSON.stringify(args);
    if (argsPath.length > 100) {
      console.warn(`[POSSIBLE PERFORMANCE ISSUE] ${fullName} has a big argument set, argsPath length > 100: ${argsPath}`);
    }

    if (!queryState.loadStatus[argsPath]) {
      // first time -> initialize query
      queryState.loadStatus[argsPath] = true;


      const ref = query(...args);

      if (!ref || !ref.onSnapshot) {
        throw new Error(fullName + ` - Query function did not (but must) return a firebase Query, DocumentReference or otherwise implement a corresponding onSnapshot function.`);
      }
      const unsub = ref.onSnapshot(async snap => {
        let result;
        if (mapFn) {
          result = loadedValue(await mapFn(snap, ...args));
        } else {
          result = snap;
        }

        this._updateQueryCache(name, argsPath, result);
      });

      // TODO: when unsubbing, also need to reset loadStatus (+ cache)
      registration.unsub = unsub;
    }

    //console.warn(fullName, argsPath, queryState.cache[argsPath]);
    return queryState.cache[argsPath];
  }

  /**
   * Takes all documents of QuerySnapshot and converts to an object, 
   * mapping id to data().
   */
  snapToById = snap => {
    const ids = snap.docs.map(d => d.id);
    const data = snap.docs.map(d => d.data());
    return zipObject(ids, data);
  }

  toString = () => {
    return this.constructor.n || this.constructor.name;
  }
}