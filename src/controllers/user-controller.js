// Modules
const moment = require('moment');
const async = require('async');

// Components
const Generator = require('../components/generator.js')();
const Formatter = require('../components/formatter.js')();

// Models
const User = require('../models/user.js')();

// Controllers
const SpotifyController = require('./spotify-controller.js')();

function UserController() {

  // Will make sure that the user exists, by first checking if it does and if so return the uid. Or creating a new user.
  function ensureUserExists(spotifyAccount) {
    return new Promise((resolve, reject) => {
      User.getByEmail(spotifyAccount.email)
        .then((user) => User.updateUserInfo(user, spotifyAccount))
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
        .then(() => updateSpotifyAuth(user, spotifyAuth))
        .then(() => resolve(token))
      .catch((error) => reject(error));
    });
  }

  function updateSpotifyAuth(user, spotifyAuth) {
    return new Promise((resolve, reject) => {
      spotifyAuth = Formatter.formatSpotifyAuth(spotifyAuth);

      User.setSpotifyAuth(user.uid, spotifyAuth)
        .then(() => resolve(spotifyAuth))
      .catch((error) => reject(error));
    });
  }

  function authenticateUser(cookies) {
    return new Promise((resolve, reject) => {
      const uid = cookies.cquid;
      const token = cookies.cqt;
      if (!uid || !token) return resolve({ validToken: false });

      User.authenticate(uid, token)
        .then((results) => {
          if (!results.validToken) return resolve(results);

          const now = parseInt(moment().format('X'));
          if (now < results.user.spotify.expires) return resolve(results);

          SpotifyController.refreshAccessToken(results.user.spotify.refreshToken)
            .then((spotifyAuth) => updateSpotifyAuth(results.user, spotifyAuth))
            .then((spotifyAuth) => {
              results.user.spotify = spotifyAuth;
              resolve(results);
            })
          .catch((error) => reject(error));
        })
      .catch((error) => reject(error));
    });
  }

  function logoutUser(user) {
    return new Promise((resolve, reject) => {
      User.removeAuthToken(user.uid, user.authToken.key)
        .then(() => resolve())
      .catch((error) => reject(error));
    });
  }

  function getAllUsers() {
    return new Promise((resolve, reject) => {
      const users = [];
      User.getAll()
        .then((usersObj) => {
          Object.keys(usersObj).forEach((uid) => {
            const user = usersObj[uid];
            user.uid = uid;
            users.push(user);
          });
          resolve(users);
        })
      .catch((error) => reject(error));
    });
  }

  function getAccessTokens() {
    return new Promise((resolve, reject) => {
      const tokens = [];
      const userTokens = getAllUsers()
        .then((users) => {
          users.forEach((u) => {
            const token = u.spotify.accessToken;
            tokens.push(token);
          });
          resolve(tokens);
        })
      .catch((error) => reject(error));
    });
  }

  function getMultipleUserTokensById(idList) {
    return new Promise((resolve, reject) => {
      const accessTokens = [];
      async.eachSeries(idList, (uid, callback) => {
        User.getById(uid)
          .then((user) => {
            accessTokens.push(user.spotify.accessToken);
            callback();
          })
        .catch((error) => callback(error));
      }, (error) => {
        if (error) return reject(error);

        resolve(accessTokens);
      });
    });
  }

  return {
    ensureUserExists,
    createNewUserLogin,
    updateSpotifyAuth,
    authenticateUser,
    logoutUser,
    getAllUsers,
    getAccessTokens,
    getMultipleUserTokensById
  };
}

module.exports = UserController;
