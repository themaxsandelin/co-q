// Modules
const async = require('async');

// Components
const admin = require('../components/admin.js');

function Event() {

  function create(event, uid) {
    return new Promise((resolve, reject) => {
      const evt = admin.database().ref('events').push(event);
      admin.database().ref('users/' + uid + '/events').push(evt.key);
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

  function getById(id) {
    return new Promise((resolve, reject) => {
      admin.database().ref('events/' + id).once('value', (snapshot) => resolve(snapshot.val()), (error) => reject(error));
    });
  }

  function getAllByAuthor(uid) {
    return new Promise((resolve, reject) => {
      admin.database().ref('users/' + uid + '/events').once('value', (snapshot) => {
        const eventsObj = snapshot.val();
        if (!eventsObj) return resolve([]);
        const eventIds = [];
        Object.keys(eventsObj).forEach((key) => {
          eventIds.push(eventsObj[key]);
        });

        const events = [];
        async.eachSeries(eventIds, (id, callback) => {
          getById(id)
            .then((event) => {
              events.push(event);
              callback();
            })
          .catch((error) => callback(error));
        }, (error) => {
          if (error) return reject(error);

          resolve(events);
        });
      });
    });
  }

  function getBySlug(slug) {
    return new Promise((resolve, reject) => {
      admin.database().ref('events').once('value', (snapshot) => {
        let event;
        const events = snapshot.val();
        Object.keys(events).forEach((id) => {
          if (events[id].slug === slug) {
            event = events[id];
            event.id = id;
          }
        });

        resolve(event);
      });
    });
  }

  return {
    create,
    getAll,
    getAllByAuthor,
    getBySlug
  };
}

module.exports = Event;
