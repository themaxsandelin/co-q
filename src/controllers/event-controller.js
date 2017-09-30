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

              Event.create(event, user.uid)
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

  function getAllAuthorEvents(user) {
    return new Promise((resolve, reject) => {
      Event.getAllByAuthor(user.uid)
        .then((events) => {
          events.forEach((evt, i) => {
            events[i].url = process.siteUrl + '/event/' + events[i].slug;
          });
          resolve(events);
        })
      .catch((error) => reject(error));
    });
  }

  function getEventBySlug(slug, user) {
    return new Promise((resolve, reject) => {
      Event.getBySlug(slug)
        .then((event) => {
          if (!event) return reject('Event not found.');

          event.isAuthor = (user.uid === event.author.uid);
          event.hasPassword = event.hasOwnProperty('password');
          if (event.hasPassword) {
            delete event.password;
            delete event.salt;
          }
          resolve(event);
        })
      .catch((error) => reject(error));
    });
  }

  return {
    createEvent,
    getAllEventSlugs,
    getAllAuthorEvents,
    getEventBySlug
  };
}

module.exports = EventController;
