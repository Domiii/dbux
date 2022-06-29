/* global __non_webpack_require__ */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
/* eslint-disable import/first */
/* eslint-disable global-require,import/first,import/no-extraneous-dependencies */

import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import isDate from 'lodash/isDate';
import sleep from '@dbux/common/src/util/sleep';
import { newLogger } from '@dbux/common/src/log/logger';
import Backlog from './Backlog';
import requireDynamic from '@dbux/common/src/util/requireDynamic';

/** @typedef {import('./BackendController').default} BackendController */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Db');

// const Verbose = true;
const Verbose = false;

const defaultNetworkTimeout = 8 * 1000;

global.self = global;   // hackfix for firebase which requires `self` to be a global


const MergeTrue = Object.freeze({ merge: true });

export class Db {
  /**
   * @param {BackendController} backendController 
   */
  constructor(backendController) {
    this.backendController = backendController;

    this.backlog = new Backlog(this.backendController.practiceManager, this._doWrite);

    // TODO: monitor firestore connection status and call `tryReplayBacklog` before doing anything other write action
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  collection(name) {
    return this.fs.collection(name);
  }

  // ###########################################################################
  // init
  // ###########################################################################

  async init() {
    this.firebase = this.requireFirebase();
    this.fs = this.initFirestore(this.firebase);
  }

  async _replay() {
    try {
      await this.backlog.replay();
    }
    catch (err) {
      warn(`Replay failed. Error: ${err.message}`);
    }
  }

  _req(target) {
    debug(`requiring ${target}...`);
    return requireDynamic(target);
  }

  /**
   * NOTE: in Node.js, bundling firebase will cause problems (as of v7.17), 
   * so we need to install it separately and load only after installation has finished.
   * @see https://github.com/firebase/firebase-js-sdk/issues/2222#issuecomment-538072948
   */
  requireFirebase() {
    try {
      // NOTE: a lot of failed experiments: unsuccessfully trying to get firebase to work without having to npm install it

      // const moduleName = ;
      // const { getResourcePath } = this.backendController.practiceManager.externals.resources;

      // let dir = getResourcePath('dist', 'node_modules', 'firebase');
      // let dir = getResourcePath('firebase');
      // dir = fs.realpathSync(dir);
      
      // sh.cp('-R', `${dir}`, getResourcePath('..', 'node_modules'));

      // const moduleAlias = require('module-alias');
      // moduleAlias.addAlias('@firebase/app', `${dir}/firebase-app.js`);


      // const _firebase = this._req(`${dir}/firebase-app.js`);
      // this._req(`${dir}/firebase-auth.js`);
      // this._req(`${dir}/firebase-firestore.js`);

      // const _firebase = this._req(`${dir}/dist/index.cjs.js`);
      // this._req(`${dir}/auth/dist/index.cjs.js`);
      // this._req(`${dir}/firestore/dist/index.cjs.js`);
      
      const _firebase = this._req(`firebase`);
      this._req('firebase/auth');
      this._req('firebase/firestore');
      this._req('firebase/storage');

      return _firebase;
    }
    catch (err) {
      throw new Error(`Unable to load firebase - ${err.stack}\n`);
    }
  }

  initFirestore(firebase) {
    const firebaseConfig = {
      apiKey: "AIzaSyC-d0HDLJ8Gd9UZ175z7dg6J98ZrOIK0Mc",
      authDomain: "learn-learn-b8e5a.firebaseapp.com",
      databaseURL: "https://learn-learn-b8e5a.firebaseio.com",
      projectId: "learn-learn-b8e5a",
      storageBucket: "learn-learn-b8e5a.appspot.com",
      messagingSenderId: "249308200308",
      appId: "1:249308200308:web:07556e84184b4546ef8021"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    return firebase.firestore();
  }

  // ###########################################################################
  // add + write
  // ###########################################################################

  async add(container, data) {
    const id = null; // will generate new random id
    return this.write(container, id, data);
  }

  async write(container, id, data) {
    this.sanitize(data);

    const writeRequest = {
      containerName: container.name,
      id,
      data
    };

    if (this.backlog.size()) {
      // make sure that all write requests are in correct order
      this.backlog.add(writeRequest);
      return null;
    }
    else {
      try {
        return await this._doWrite(writeRequest);
      }
      catch (err) {
        warn(`Write failed, ${err.stack}`);
        // failed to write
        this.backlog.add(writeRequest);
        return null;
      }
    }
  }

  // ###########################################################################
  // write implementation
  // ###########################################################################

  waitForWriteFinish = async () => {
    // wait until it's our turn
    await this._writePromise?.then(this.waitForWriteFinish);
  }

  _doWrite = async (request) => {
    await this.waitForWriteFinish();
    const {
      containerName,
    } = request;
    const container = this.backendController.containers[containerName];
    if (!container) {
      // TODO: handle this better?
      warn(`Ignoring invalid write request. Container does not exist: "${containerName}"`);
      return null;
    }

    return this._writePromise = this._doWritePromise(container, request);
  }

  async _doWritePromise(container, request) {
    let result;
    let doc;
    try {
      const {
        id,
        data
      } = request;

      const { collection } = container;
      doc = collection.doc(id);
      Verbose && debug('writing data', data);

      result = await Promise.race([
        (async () => {
          await doc.set(data, MergeTrue);
        })(),
        sleep(defaultNetworkTimeout).then(() => {
          throw new Error(`Timeout when writing data to firebase (${defaultNetworkTimeout / 1000}s)`);
        })
      ]);

      await this.backlog.tryRemoveEntry(request);
      await this.backendController.increaseContainerPerformanceCounter(container, 'write');
    }
    catch (err) {
      throw new Error(`Failed to write to DB (at "${doc?.path}"): ${JSON.stringify(request, null, 2)}\n\n${err.message}`);
    }
    finally {
      this._writePromise = null;
    }
    return result;
  }

  // ###########################################################################
  // other utils
  // ###########################################################################

  buildUserFileRef(filename) {
    let { uid } = this.firebase.auth().currentUser;
    let ref = this.firebase.storage().ref().child(`${uid}/${filename}`);

    return ref;
  }

  sanitize(object) {
    for (const key in object) {
      if (isPlainObject(object[key])) {
        this.sanitize(object[key]);
      }
      else if (isArray(object[key])) {
        this.sanitize(object[key]);
      }
      else if (object[key] === undefined) {
        object[key] = null;
      }
      else if (isDate(object[key])) {
        object[key] = JSON.parse(JSON.stringify(object[key]));
      }
    }
  }
}

// still will not exactly by the order they being requested.
// for example: (timeout is 8 seconds)
// time:  1-2-3-4-5-6-7-8-9-0-1-2-3-4-5-6-7-8
// event: a-----------c---b-----e-----d------
// a: event x pending
// c: event y pending
// b: event x timeout (backlog: [x])
// e: event z incoming, not penging since backlog not empty [xz]
// d: event y timeout (backlog: [xzy])
// can we just push every event into backlog and process them one by one?