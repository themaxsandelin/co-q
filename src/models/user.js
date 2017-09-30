// Components
const admin = require('../components/admin.js');

function User() {

  function getByEmail(email) {
    return new Promise((resolve, reject) => {
      admin.auth().getUserByEmail(email)
        .then((userRecord) => resolve(userRecord.toJSON()))
      .catch((error) => reject(error));
    });
  }

  function getById(uid) {
    return new Promise((resolve, reject) => {
      admin.auth().getUser(uid)
        .then((userRecord) => resolve(userRecord.toJSON()))
      .catch((error) => reject(error));
    });
  }

  function getAll() {
    return new Promise((resolve, reject) => {
      admin.database().ref('users').once('value', (snapshot) => {
        resolve(snapshot.val());
      });
    });
  }

  function create(spotifyAccount) {
    return new Promise((resolve, reject) => {
      admin.auth().createUser({ email: spotifyAccount.email, displayName: spotifyAccount.displayName })
        .then((userRecord) => {
          const user = userRecord.toJSON();
          admin.database().ref('users/' + user.uid).set({
            email: spotifyAccount.email,
            username: spotifyAccount.id,
            name: spotifyAccount.display_name,
            authTokens: []
          });

          resolve(user);
        })
      .catch((error) => reject(error));
    });
  }

  function addAuthToken(uid, token) {
    return new Promise((resolve, reject) => {
      admin.database().ref('users/' + uid + '/authTokens').push(token);
      resolve();
    });
  }

  function setSpotifyAuth(uid, auth) {
    return new Promise((resolve, reject) => {
      admin.database().ref('users/' + uid + '/spotify').set(auth);
      resolve();
    });
  }

  function authenticate(uid, token) {
    return new Promise((resolve, reject) => {
      getById(uid)
        .then((user) => {

          let tokenKey;
          let validToken = false;
          admin.database().ref('users/' + uid).once('value', (snapshot) => {
            const userObj = snapshot.val();
            Object.keys(userObj.authTokens).forEach((key) => {
              if (userObj.authTokens[key] === token) {
                tokenKey = key;
                validToken = true
              };
            });

            userObj.uid = uid;
            userObj.authToken = {
              token: token,
              key: tokenKey
            };
            delete userObj.authTokens;
            resolve({ validToken: validToken, user: userObj });
          }, (error) => reject(error));

        })
      .catch((error) => reject(error));
    });
  }

  function deleteAuthToken(uid, tokenKey) {
    return new Promise((resolve, reject) => {
      admin.database().ref('users/' + uid + '/authTokens/' + tokenKey).remove();
      resolve();
    });
  }

  return {
    getByEmail,
    getById,
    getAll,
    create,
    addAuthToken,
    setSpotifyAuth,
    authenticate,
    deleteAuthToken
  };
}

module.exports = User;
