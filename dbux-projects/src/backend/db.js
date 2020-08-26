/* eslint-disable global-require,import/first,import/no-extraneous-dependencies */

import { newLogger } from '@dbux/common/src/log/logger';
import Backlog from './Backlog';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Db');

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

  constructor() {
    this.firebase = getFirebase();
    this.fs = getFirestore();

    // TODO: implement Backlog
    this.backlog = new Backlog();

    // TODO: monitor firestore connection status and call `tryReplayBacklog` before doing anything other write action
  }

  // ###########################################################################
  // containers
  // ###########################################################################

  registerContainer(container) {
    this.containersByName.set(container.name, container);
  }

  getContainer(name) {
    return this.containersByName[name];
  }

  // ###########################################################################
  // add + write
  // ###########################################################################

  async add(container, data) {
    const id = null; // will generate new random id
    return this.write(container, id, data);
  }

  async write(container, id, data) {
    const writeRequest = {
      containerName: container.name,
      id,
      data
    };

    if (this.hasBacklog()) {
      // make sure that all write requests are in correct order
      this.addBackLog(writeRequest);
      return null;
    }
    else {
      try {
        return this._doWrite(writeRequest);
      }
      catch (err) {
        // failed to write
        this.backlog.addBackLog(writeRequest);
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

  async _doWrite(request) {
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

      result = await doc.set(data, MergeTrue);
    }
    catch (err) {
      warn(`Failed to write to DB (at ${container.name}): ${err.stack}`);
    }
    finally {
      this._writePromise = null;
    }
    return result;
  }
}