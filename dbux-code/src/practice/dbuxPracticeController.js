import {
  authentication
} from 'vscode';

import CodeSubmissions from './CodeSubmissions';
import PracticeClient from './PracticeClient';

class DbuxPracticeController {
  constructor() {
    this.client = new PracticeClient();
    this.submissions = new CodeSubmissions(this);
  }
}



// ###########################################################################
// test out authentication
// ###########################################################################

const providerId = 'github';
const scopes = ['user:email'];

async function loginIfNecessaryAndGetToken() {
  const sessions = await authentication.getSessions(providerId, scopes);
  let session;
  if (sessions.length) {
    [session] = sessions;
    // const token = await session.getAccessToken();
  } else {
    session = await authentication.login(providerId, scopes);
  }

  // NOTE: we can verify accessToken on server by using the accessToken to send a query for the user
  // TODO: need encryption (e.g. HTTPS) before sending around github accessTokens

  // result is a JSON object where result.login === session.accountName
  // exec(`curl -H "Authorization: token ${accessToken}" https://api.github.com/user`)
  const token = await session.getAccessToken();
  console.log('login successful!', JSON.stringify(session), token);

  return session;
}

async function getSession() {
  return loginIfNecessaryAndGetToken();
}

export function initDbuxPractice(context) {
  // if (authentication.providerIds.includes(providerId)) {
  //   loginIfNecessary();
  // }

  // authentication.onDidChangeAuthenticationProviders(async e => {
  //   if (e.added.includes(providerId)) {
  //     loginIfNecessary();
  //   }
  // });
}