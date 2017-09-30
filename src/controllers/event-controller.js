// Modules
const crypto = require('crypto');

// Components
const Validator = require('../components/validator.js')();
const Generator = require('../components/generator.js')();

// Models
const Event = require('../models/event.js')();

function EventController() {

  function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 256, 'sha512').toString('hex');
  }

  function createEvent(body, user) {
    return new Promise((resolve, reject) => {
      Validator.validateEventBody(body)
        .then(() => {
          getAllEventSlugs()
            .then((slugs) => {
              if (slugs.indexOf(body.slug) > -1) return reject('The slug you provided has already been taken.');

              const event = body;
              event.author = {
                uid: user.uid,
                name: user.name
              };
              if (body.password) {
                body.salt = Generator.generateUniqueString(512);
                body.password = hashPassword(body.password, body.salt);
              } else {
                delete event.password;
              }

              Event.create(event)
                .then(() => resolve(event))
              .catch((error) => reject(error));
            })
          .catch((error) => reject(error));
        })
      .catch((error) => reject(error));
    });
  }

  function getAllEventSlugs() {
    return new Promise((resolve, reject) => {
      Event.getAll()
        .then((events) => {
          const slugs = [];
          if (!events) return resolve(slugs);
          const ids = Object.keys(events);

          ids.forEach((id) => {
            slugs.push(events[id].slug);
          });
          resolve(slugs);
        })
      .catch((error) => reject(error));
    });
  }

  return {
    createEvent,
    getAllEventSlugs
  };
}

module.exports = EventController;
