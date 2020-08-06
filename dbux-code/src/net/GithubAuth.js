import {
  authentication
} from 'vscode';

import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PracticeController');

// import CodeSubmissions from './CodeSubmissions';
// import PracticeClient from './PracticeClient';

// class DbuxPracticeController {
//   constructor() {
//     this.client = new PracticeClient();
//     this.submissions = new CodeSubmissions(this);
//   }
// }



// ###########################################################################
// Github Auth
// @see https://github.com/microsoft/vscode-extension-samples/blob/master/github-authentication-sample/src/credentials.ts
// ###########################################################################

const GITHUB_AUTH_PROVIDER_ID = 'github';
// The GitHub Authentication Provider accepts the scopes described here:
// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
const SCOPES = ['user:email'];

export async function interactiveGithubLogin() {
  // set createIfNone to false to quietly re-establish previous session without trying to prompt for login
  // const session = await authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: false });
  
  const session = await authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { 
    createIfNone: true,
    clearSessionPreference: true
  });

  const s = JSON.stringify(session, null, 2);
  log('successfully logged in with Github', s);

  return session;
}

// curl -H "Authorization: token ACCESS_TOKEN" https://api.github.com/user
// function fetchGithubAccountData(accessToken) {
//   // NOTE: we can verify accessToken by using the accessToken to send a query for the user.
//   // const user = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${accessToken}` } })
//   // user.login === session.accountName
// }