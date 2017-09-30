// Components
const admin = require('../components/admin.js');

function Vibes() {

  function getAll() {
    return new Promise((resolve, reject) => {
      admin.database().ref('vibes').once('value', (snapshot) => resolve(snapshot.val()));
    });
  }

  return {
    getAll
  };
}

module.exports = Vibes;
