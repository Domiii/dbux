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
// test out authentication
// ###########################################################################

const providerId = 'github';
const scopes = ['user:email'];

export async function askUserForGithubLogin() {
  const sessions = await authentication.getSessions(providerId, scopes);
  let session;
  if (sessions.length) {
    [session] = sessions;
    // const token = await session.getAccessToken();
  } else {
    session = await authentication.login(providerId, scopes);
  }

  const token = await session.getAccessToken();
  log('login successful!', JSON.stringify(session), token);

  return session;
}

// async function getSession() {
//   return loginIfNecessaryAndGetToken();
// }

export function initDbuxPractice(/* context */) {
  // if (authentication.providerIds.includes(providerId)) {
  //   loginIfNecessary();
  // }

  // authentication.onDidChangeAuthenticationProviders(async e => {
  //   if (e.added.includes(providerId)) {
  //     loginIfNecessary();
  //   }
  // });
}

// curl -H "Authorization: token ACCESS_TOKEN" https://api.github.com/user
// function fetchGithubAccountData(accessToken) {
//   // NOTE: we can verify accessToken by using the accessToken to send a query for the user.
//   // const user = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${accessToken}` } })
//   // user.login === session.accountName
// }