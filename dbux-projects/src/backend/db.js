/* eslint-disable import/first */

global.self = global;   // hackfix for firebase which requires `self` to be a global

import firebase from 'firebase';
import 'firebase/auth';
import 'firebase/firestore';


// Your web app's Firebase configuration
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

const db = firebase.firestore();
export default db;

export {
  firebase
};