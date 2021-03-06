// Modules
const async = require('async');

// Components
const admin = require('../components/admin.js');

function Event() {

  function create(event, uid) {
    return new Promise((resolve, reject) => {
      const evt = admin.database().ref('events').push(event);
      resolve(evt.key);
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

  function signupUser(id, uid) {
    return new Promise((resolve, reject) => {
      admin.database().ref('events/' + id + '/attendees').push(uid);
      resolve();
    });
  }

  function removeAttendee(id, attendeeKey) {
    return new Promise((resolve, reject) => {
      admin.database().ref('events/' + id + '/attendees/' + attendeeKey).remove();
      resolve();
    });
  }

  return {
    create,
    getAll,
    getById,
    getBySlug,
    signupUser,
    removeAttendee
  };
}

module.exports = Event;
