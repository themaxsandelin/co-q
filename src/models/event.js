// Components
const admin = require('../components/admin.js');

function Event() {

  function create(event) {
    return new Promise((resolve, reject) => {
      admin.database().ref('events').push(event);
      resolve();
    });
  }

  function getAll() {
    return new Promise((resolve, reject) => {
      admin.database().ref('events').once('value', (snapshot) => {
        resolve(snapshot.val());
      }, (error) => reject(error));
    });
  }

  return {
    create,
    getAll
  };
}

module.exports = Event;
