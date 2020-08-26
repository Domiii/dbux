/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
/* eslint-disable import/first */

import path from 'path';

/**
 * @typedef {import('../ProjectsManager').default} ProjectsManager
 */

global.self = global;   // hackfix for firebase which requires `self` to be a global

let _db, firebase;

/**
 * NOTE: in Node.js, bundling firebase will cause problems (as of v7.17), 
 * so we need to install it separately and load only after installation has finished.
 * @see https://github.com/firebase/firebase-js-sdk/issues/2222#issuecomment-538072948
 */
export function getFirebase() {
  return firebase;
}

export default function getDb() {
  if (_db) {
    return _db;
  }

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

  return _db = firebase.firestore();
}

/**
 * 
 * @param {ProjectsManager} manager 
 */
export function initDB(manager) {
  if (!firebase) {
    let { dependencyRoot } = manager.config;
    let nodeModules = path.join(dependencyRoot, 'node_modules');
    try {
      firebase = __non_webpack_require__(path.join(nodeModules, 'firebase'));
      __non_webpack_require__(path.join(nodeModules, 'firebase/auth'));
      __non_webpack_require__(path.join(nodeModules, 'firebase/firestore'));
    } catch (err) {
      throw new Error(`Unable to load firebase. Make sure to call installBackendDependencies before trying to access DB capabilities: ${err.message}`);
    }
  }

  getDb();

  return { _db, firebase };
}