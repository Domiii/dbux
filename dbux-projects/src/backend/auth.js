import db, { firebase } from './db';

export function initAuth() {
  firebase.auth().onAuthStateChanged(function (user) {
    console.debug(`Auth changed: ${user && `${user.displayName} (${user.email})` || '(not logged in)'}`);

    if (user) {
      // User is signed in.
    } else {
      // No user is signed in.
    }
  });
}

export async function login() {
  const githubAuth = await askUserForGithubLogin();
  const githubAccessToken = githubAuth.accessToken;
  const cred = firebase.auth.GithubAuthProvider.credential(githubAccessToken);
  return await firebase.auth().signInWithCredential(cred);
}


// /**
//  * PROBLEM: Cannot persist the result of email-based login because the Node version of the library does not support LOCAL auth persistence
//        see: https://firebase.google.com/docs/auth/web/auth-state-persistence#supported_types_of_auth_state_persistence
//  */
// export async function loginWithEmailLink(email) {
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
