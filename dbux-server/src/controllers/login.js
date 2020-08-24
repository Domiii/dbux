
import fetch from 'node-fetch';
import { admin } from 'firebase-admin';
import * as serviceAccount from process.env.GOOGLE_APPLICATION_CREDENTIALS;

let _initialized;
function initializeFirebase() {
  if (!_initialized) {
    admin.initializeApp(serviceAccount);
  }
}

async function createToken(userId) {
  initializeFirebase();

  try {
    let token = await admin.auth().createCustomToken(userId);
    return token;
  }
  catch (err) {
    throw new Error(`Error when creating custom token: ${err.message}`);
  }
  
}

export async function verify(request, response) {
  let token = request.query.githubAccessToken;

  try {
    const user = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${token}` } });
    const newToken = await createToken(token);
    response.send(newToken);
  } 
  catch (err) {
    response.status(400).send(`Failed with error: ${err}`);
  }
}