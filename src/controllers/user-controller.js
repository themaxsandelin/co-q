// Modules
const moment = require('moment');

// Components
const Generator = require('../components/generator.js')();
const Formatter = require('../components/formatter.js')();

// Models
const User = require('../models/user.js')();

function UserController() {

  // Will make sure that the user exists, by first checking if it does and if so return the uid. Or creating a new user.
  function ensureUserExists(spotifyAccount) {
    return new Promise((resolve, reject) => {
      User.getByEmail(spotifyAccount.email)
        .then((user) => resolve(user))
      .catch((error) => {
        if (error.code !== 'auth/user-not-found') return reject(error);

        User.create(spotifyAccount)
          .then((user) => resolve(user))
        .catch((error) => reject(error));
      });
    });
  }

  function createNewUserLogin(user, spotifyAuth) {
    return new Promise((resolve, reject) => {
      const token = Generator.generateUniqueString(128);
      User.addAuthToken(user.uid, token)
        .then(() => {
          spotifyAuth.expires = parseInt(moment().add(spotifyAuth.expires_in, 'seconds').format('X'));
          spotifyAuth = Formatter.formatObjectKeys(spotifyAuth);
          delete spotifyAuth.expiresIn;

          User.setSpotifyAuth(user.uid, spotifyAuth)
            .then(() => resolve(token))
          .catch((error) => reject(error));
        })
      .catch((error) => reject(error));
    });
  }

  function authenticateUser(cookies) {
    return new Promise((resolve, reject) => {
      const uid = cookies.cquid;
      const token = cookies.cqt;
      if (!uid || !token) return resolve({ validToken: false });

      User.authenticate(uid, token)
        .then((results) => resolve(results))
      .catch((error) => reject(error));
    });
  }

  function logoutUser(user) {
    return new Promise((resolve, reject) => {
      User.deleteAuthToken(user.uid, user.authToken.key)
        .then(() => resolve())
      .catch((error) => reject(error));
    });
  }

  return {
    ensureUserExists,
    createNewUserLogin,
    authenticateUser,
    logoutUser
  };
}

module.exports = UserController;
