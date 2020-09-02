import { newLogger } from '@dbux/common/src/log/logger';
import { makeLoginController } from './LoginController';
import { fetchGET } from '../util/fetch';
import { result } from 'lodash';

/** @typedef {import('./BackendController').default} BackendController */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Firebase Auth');

// TODO: create and use Webview for firebase auth to get an `accessToken` (since the node version of firebase does not support proper, persistable login methods)



export default class BackendAuth {
  /**
   * @param {BackendController} backendController 
   */
  constructor(backendController) {
    this.backendController = backendController;

    // const firebase = getFirebase();
    // this._authInitPromise = new Promise((resolve, reject) => {
    //   firebase.auth().onAuthStateChanged((user) => {
    //     debug(`Auth state changed: ${user && `${user.displayName} (${user.email})` || '(not logged in)'}`);

    //     if (user) {
    //       // User is signed in.
    //     } else {
    //       // No user is signed in.
    //     }

    //     if (this._authInitPromise) {
    //       this._authInitPromise = null;
    //       resolve(user);
    //     }
    //   });
    // });
  }

  async waitUntilAuthInit() {
    return this._authInitPromise;
  }

  // TODO: we cannot sign into firebase because firebase uses a github app client secret for validation with github, and we don't know VSCode's default app's clientsecret
  // async loginWithGithubToken() { 
  //   await this.waitUntilAuthInit();

  //   const { interactiveGithubLogin } = this._backendController.practiceManager.externals;
  //   const githubAuth = await interactiveGithubLogin();

  //   // const githubAccessToken = githubAuth.accessToken;
  //   // const cred = firebase.auth.GithubAuthProvider.credential(githubAccessToken);
  //   // return await firebase.auth().signInWithCredential(cred);
  // }

  /**
   * 
   * @param {string} githubAccessToken 
   * @return {string} Custom token.
   */
  async getCustomTokenByGithubAccessToken(githubAccessToken) {
    try {
      return await fetchGET(`http://localhost:2719`, `githubAccessToken=${githubAccessToken}`, undefined, undefined, { raw: true });
    } 
    catch (err) {
      throw new Error(`getCustomTokenByGithubAccessToken failed: ${err.message}`);
    }
  }

  async getNewCustomToken() {
    const githubAuth = await this.backendController.practiceManager.externals.interactiveGithubLogin();
    const githubAccessToken = githubAuth.accessToken;
    return this.getCustomTokenByGithubAccessToken(githubAccessToken);
  }

  /**
   * @param {Boolean} forceRefresh
   * @return {Object}
   */
  async getCustomToken(forceRefresh = false) {
    const keyName = 'dbux.projects.backend.customToken';
    const { get, set } = this.backendController.practiceManager.externals.storage;

    let refreshed = false;
    let customToken;
    if (!forceRefresh) {
      customToken = get(keyName);
      debug(`custom token in memento:`, customToken);
    }

    if (forceRefresh || !customToken) {
      customToken = await this.getNewCustomToken();
      await set(keyName, customToken);
      refreshed = true;
    }

    return { refreshed, customToken };
  }

  async testFirebase() {
    await this.backendController.db.fs.collection("testCollection").add({ x: 1 });
  }

  async login() {
    let { refreshed, customToken } = await this.getCustomToken();

    debug(`real custom token`, customToken);

    try {
      await this.backendController.db.firebase.auth().signInWithCustomToken(customToken);
    } 
    catch (err) {
      if (refreshed) {
        throw new Error(`Refreshed custom token login failed: ${err.message}`);
      }
      else {
        ({ customToken } = await this.getCustomToken(true));
        try {
          await this.backendController.db.firebase.auth().signInWithCustomToken(customToken);
        }
        catch (err2) {
          throw new Error(`Force refreshed custom token login failed: ${err2.message}`);
        }
      }
    }

    try {
      await this.testFirebase();
    } catch (err) {
      throw new Error(`Test firebase failed: ${err.message}`);
    }

    debug("Login finished.");
    this.backendController.practiceManager.externals.showMessage.info('Login successed.');
  }

  logout() {
    return this.backendController.db.fs.auth().signOut();
  }

  // /**
  //  * PROBLEM: Cannot persist the result of email-based login because the Node version of the library does not support LOCAL auth persistence
  //        see: https://firebase.google.com/docs/auth/web/auth-state-persistence#supported_types_of_auth_state_persistence
  //  */
  // async loginWithEmailLink(email) {
  //   const actionCodeSettings = {
  //     // URL you want to redirect back to. The domain (www.example.com) for this
  //     // URL must be whitelisted in the Firebase Console.
  //     url: 'http://localhost:3000/loggedin',
  //     // This must be true.
  //     handleCodeInApp: true
  //   };

  //   await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);

  //   // TODO: start local server and grab link automatically
  //   const emailLink = await input('Email sent! Please provide the email link here.\n >');

  //   const result = await firebase.auth().signInWithEmailLink(email, emailLink);

  //   // This gives you a Google Access Token. You can use it to access the Google API.
  //   // var token = .accessToken;
  //   // The signed-in user info.
  //   var user = result.user;

  //   console.log(`Login SUCCESSFUL. User: ${user.email}, ${result.credential}`);
  //   console.log('  Result', JSON.stringify(result));

  //   // fs.writeFileSync('cred.json', JSON.stringify(result.credential));
  //   // ...
  //   return user;
  // }
}