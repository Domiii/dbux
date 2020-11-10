
import env from 'dotenv';
import path from 'path';
import firebase from 'firebase-admin';

// read env file
env.config({ path: __dirname + '/../.env' });

// make sure, credentials are setup right!
// console.log('CREDENTIALS', path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS), result);


const credential = firebase.credential.applicationDefault();
// console.error(require('process').env.GOOGLE_APPLICATION_CREDENTIALS, result);

// console.log(); console.log(); console.log();
// const credential = JSON.parse(
//   require('fs').readFileSync(
//     require('process').env.GOOGLE_APPLICATION_CREDENTIALS,
//     {
//       encoding: 'utf-8'
//     }
//   )
// );

const firebaseConfig = {
  credential,

  // see: https://github.com/firebase/firebase-admin-node/issues/647
  // credential: admin.credential.refreshToken({ type: 'authorized_user', refresh_token: (new (require('configstore'))('firebase-tools')).get('tokens.refresh_token'), client_id: require('firebase-tools/lib/api').clientId, client_secret: require('firebase-tools/lib/api').clientSecret }),

  databaseURL: "https://learn-learn-b8e5a.firebaseio.com",
  projectId: "learn-learn-b8e5a",
  messagingSenderId: "249308200308",
  storageBucket: "learn-learn-b8e5a.appspot.com",
  appId: "1:249308200308:web:07556e84184b4546ef8021"
};

// login failed? -> see https://github.com/firebase/firebase-admin-node/issues/745

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

export {
  firebase
};

export default db;