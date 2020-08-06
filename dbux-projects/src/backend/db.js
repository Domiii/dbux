/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
/* eslint-disable import/first */

global.self = global;   // hackfix for firebase which requires `self` to be a global

let _db, firebase;

/**
 * NOTE: in Node.js, bundling firebase will cause problems (as of v7.17), 
 * so we need to install it separately and load only after installation has finished.
 * @see https://github.com/firebase/firebase-js-sdk/issues/2222#issuecomment-538072948
 */
export function getFirebase() {
  if (!firebase) {
    firebase = require('firebase');
    require('firebase/auth');
    require('firebase/firestore');
  }

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