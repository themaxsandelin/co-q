// Components
const admin = require('../components/admin.js');

function Event() {

  function create(event) {
    return new Promise((resolve, reject) => {
      admin.database().ref('events').push(event);
      resolve();
    });
  }

  return {
    create
  };
}

module.exports = Event;
