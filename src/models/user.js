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

  function create(email, displayName) {
    return new Promise((resolve, reject) => {
      admin.auth().createUser({ email: email, displayName: displayName })
        .then((userRecord) => resolve(userRecord.toJSON()))
      .catch((error) => reject(error));
    });
  }

  function createAuthToken(uid) {
    return new Promise((resolve, reject) => {
      admin.auth().createCustomToken(uid)
        .then((token) => resolve(token))
      .catch((error) => reject(error));
    });
  }

  return {
    getByEmail,
    create,
    createAuthToken
  };
}

module.exports = User;
