/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
/* eslint-disable import/first */
/* eslint-disable global-require,import/first,import/no-extraneous-dependencies */

import { isPlainObject } from 'lodash';
import { newLogger } from '@dbux/common/src/log/logger';
import Backlog from './Backlog';
import { initContainers } from './containers/index';

/** @typedef {import('./BackendController').default} BackendController */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Db');

const defaultNetworkTimeout = 2500;

global.self = global;   // hackfix for firebase which requires `self` to be a global

let _firestoreInstance, firebase;

/**
 * NOTE: in Node.js, bundling firebase will cause problems (as of v7.17), 
 * so we need to install it separately and load only after installation has finished.
 * @see https://github.com/firebase/firebase-js-sdk/issues/2222#issuecomment-538072948
 */
export function getFirebase() {
  if (!firebase) {
    try {
      firebase = require('firebase');
      require('firebase/auth');
      require('firebase/firestore');
    }
    catch (err) {
      throw new Error(`Unable to load firebase. Make sure to call installBackendDependencies before trying to access DB capabilities: err.message`);
    }
  }

  return firebase;
}

export default function getFirestore() {
  if (_firestoreInstance) {
    return _firestoreInstance;
  }
  getFirebase();

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

  return _firestoreInstance = firebase.firestore();
}


const MergeTrue = Object.freeze({ merge: true });

export class Db {
  containersByName = new Map();

  /**
   * @param {BackendController} backendController 
   */
  constructor(backendController) {
    this.backendController = backendController;

    this.backlog = new Backlog(this.backendController.practiceManager, this._doWrite);

    // TODO: monitor firestore connection status and call `tryReplayBacklog` before doing anything other write action
  }

  async init() {
    this.firebase = getFirebase();
    this.fs = getFirestore();

    let containers = await initContainers(this);
    for (let container of containers) {
      this.registerContainer(container);
    }

    try {
      await this.backlog.replay();
    } 
    catch (err) {
      warn(`Replay failed. Error: ${err.message}`);
    }
  }

  collection(name) {
    return this.fs.collection(name);
  }

  // ###########################################################################
  // containers
  // ###########################################################################

  registerContainer(container) {
    this.containersByName.set(container.name, container);
  }

  getContainer(name) {
    return this.containersByName.get(name);
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
    const container = this.getContainer(containerName);
    if (!container) {
      // TODO: handle this better?
      warn(`Ignoring invalid write request. Container does not exist: "${containerName}"`);
      return null;
    }

    return this._writePromise = this._doWritePromise(container, request);
  }

  async _doWritePromise(container, request) {
    let result;
    try {
      const {
        id,
        data
      } = request;

      const { collection } = container;
      const doc = collection.doc(id);
      debug('data', data);

      result = await new Promise((resolve, reject) => {
        doc.set(data, MergeTrue).then(resolve);
        setTimeout(() => { reject(new Error(`Timeout on writing data to firebase.`)); }, defaultNetworkTimeout);
      });
    }
    catch (err) {
      throw new Error(`Failed to write to DB (at ${container.name}): ${err.message}`);
    }
    finally {
      this._writePromise = null;
    }
    return result;
  }

  // ###########################################################################
  // other utils
  // ###########################################################################

  sanitize(object) {
    for (const key in object) {
      if (isPlainObject(object[key])) {
        this.sanitize(object[key]);
      }
      else if (object[key] === undefined) {
        object[key] = null;
      }
    }
  }
}