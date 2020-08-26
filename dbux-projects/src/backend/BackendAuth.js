import { newLogger } from '@dbux/common/src/log/logger';
import getDb, { getFirebase } from './Db';
import { makeLoginController } from './LoginController';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Firebase Auth');

// TODO: create and use Webview for firebase auth to get an `accessToken` (since the node version of firebase does not support proper, persistable login methods)



export default class BackendAuth {
  constructor(backendController) {
    this.backendController = backendController;

    const firebase = getFirebase();
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

  async login() {
    const { WebviewWrapper } = this.backendController.practiceManager.externals;
    this.loginController = makeLoginController(WebviewWrapper);
    return this.loginController.show();
  }

  async loginWithLocalServer() {
    // 1. start local server
    // 2. navigate user to website and let user follow login flow
    // 3. get + store result accessToken
    
    // const cred = firebase.auth.GoogleAuthProvider.credential(googleAccessToken);
    // return await firebase.auth().signInWithCredential(cred);
  }

  logout() {
    return getFirebase().auth().signOut();
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