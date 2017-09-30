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

        User.create(spotifyAccount.email, spotifyAccount.display_name)
          .then((user) => resolve(user))
        .catch((error) => reject(error));
      });
    });
  }

  function createNewUserLogin(user) {
    return new Promise((resolve, reject) => {
      User.createAuthToken(user.uid)
        .then((token) => resolve(token))
      .catch((error) => reject(error));
    });
  }

  return {
    ensureUserExists
  };
}

module.exports = UserController;
