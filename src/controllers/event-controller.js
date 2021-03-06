// Modules
const crypto = require('crypto');
const async = require('async');

// Components
const Validator = require('../components/validator.js')();
const Generator = require('../components/generator.js')();
const SongSelector = require('../components/song-selector.js')();

/**
* Controllers
*/
const SpotifyController = require('./spotify-controller.js')();
const UserController = require('./user-controller.js')();

// Models
const Event = require('../models/event.js')();

function EventController() {

  function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 256, 'sha512').toString('hex');
  }

  function verifyPassword(input, password, salt) {
    return (hashPassword(input, salt) === password);
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
                name: user.name || user.username,
                avatar: user.avatar || ''
              };
              if (body.password) {
                body.salt = Generator.generateUniqueString(512);
                body.password = hashPassword(body.password, body.salt);
              } else {
                delete event.password;
              }

              Event.create(event, user.uid)
                .then((eventId) => {
                  event.id = eventId;
                  event.attendeeCount = 1;
                  event.url = process.siteUrl + '/event/' + event.slug;
                  resolve(event);
                })
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

  function getAllUserSpecificEvents(user) {
    return new Promise((resolve, reject) => {
      Event.getAll()
        .then((eventObjects) => {
          const attendingEvents = [];
          const authorEvents = [];

          if (eventObjects) {
            const events = [];
            Object.keys(eventObjects).forEach((id) => {
              const event = eventObjects[id];
              event.id = id;
              events.push(event);
            });

            events.forEach((evt, i) => {
              evt.url = process.siteUrl + '/event/' + evt.slug;
              evt.attendeeCount = (evt.attendees) ? (Object.keys(evt.attendees).length + 1):1;
              if (evt.author.uid === user.uid) {
                authorEvents.push(evt);
              } else {
                if (evt.attendees) {
                  Object.keys(evt.attendees).forEach((key) => {
                    if (evt.attendees[key] === user.uid) {
                      attendingEvents.push(evt);
                    }
                  });
                }
              }
            });
          }
          resolve({ attendingEvents: attendingEvents, authorEvents: authorEvents });
        })
      .catch((error) => reject(error));
    });
  }

  function getEventBySlug(slug, user) {
    return new Promise((resolve, reject) => {
      Event.getBySlug(slug)
        .then((event) => {
          if (!event) return reject('Event not found.');

          const attendeesObj = event.attendees;
          event.attendees = [];
          if (attendeesObj) {
            Object.keys(attendeesObj).forEach((id) => {
              event.attendees.push(attendeesObj[id]);
            });
          }

          const hasPassword = event.hasOwnProperty('password');

          event.isAuthor = (user.uid === event.author.uid);
          event.isAttending = (event.isAuthor || event.attendees.indexOf(user.uid) > -1);
          event.needsPassword = (!event.isAuthor && hasPassword && !event.isAttending);

          delete event.password;
          delete event.salt;
          resolve(event);
        })
      .catch((error) => reject(error));
    });
  }

  function getEventById(eventId, user) {
    return new Promise((resolve, reject) => {
      Event.getById(eventId)
        .then((event) => {
          if (!event) return reject('Event not found.');

          const attendeesObj = event.attendees;
          event.attendees = [];
          if (attendeesObj) {
            Object.keys(attendeesObj).forEach((id) => {
              event.attendees.push(attendeesObj[id]);
            });
          }

          const hasPassword = event.hasOwnProperty('password');

          event.isAuthor = (user.uid === event.author.uid);
          event.isAttending = (event.isAuthor || event.attendees.indexOf(user.uid) > -1);
          event.needsPassword = (!event.isAuthor && hasPassword && !event.isAttending);

          delete event.password;
          delete event.salt;
          resolve(event);
        })
      .catch((error) => reject(error));
    });
  }

  function singupUserForEvent(user, body) {
    return new Promise((resolve, reject) => {
      if (!body.eventId) return reject('Missing eventId parameter.');

      Event.getById(body.eventId)
        .then((event) => {
          if (!event) return reject('Event not found.');

          if (body.password && event.password && !verifyPassword(body.password, event.password, event.salt)) return reject('Incorrect event password.');
          const attendeesObj = event.attendees;
          event.attendees = [];
          if (attendeesObj) {
            Object.keys(attendeesObj).forEach((id) => {
              event.attendees.push(attendeesObj[id]);
            });
          }
          if (event.attendees.indexOf(user.uid) > -1) return reject('You are already attending at this event.');

          Event.signupUser(body.eventId, user.uid)
            .then(() => resolve())
          .catch((error) => reject(error));
        })
      .catch((error) => reject(error));
    });
  }

  function removeEventAttendee(user, body) {
    return new Promise((resolve, reject) => {
      if (!body.eventId) return reject('Missing eventId parameter');

      Event.getById(body.eventId)
        .then((event) => {
          if (!event) return reject('Event not found.');

          let attendeeKey;
          Object.keys(event.attendees).forEach((key) => {
            if (event.attendees[key] === user.uid) attendeeKey = key;
          });
          if (!attendeeKey) return reject('You are not an attendee at this event.');

          Event.removeAttendee(body.eventId, attendeeKey)
            .then(() => resolve())
          .catch((error) => reject(error));
        })
      .catch((error) => reject(error));
    });
  }

  function startEvent(event, user, updateCallback) {
    updateCallback({ update: 'start-event-progress', progress: 20, message: 'Loading music tastes..' });

    UserController.getMultipleUserTokensById(event.attendees)
      .then((tokens) => {
        updateCallback({ update: 'start-event-progress', progress: 40, message: 'Loading top genres..' });

        SpotifyController.getTopGenresForEvent(tokens)
          .then((genres) => {
            updateCallback({ update: 'start-event-progress', progress: 70, message: 'Loading top tracks..' });

            SongSelector.getTopTracksForEvent(event, tokens)
                .then((tracks) => {
                  updateCallback({ update: 'start-event-progress', progress: 90, message: 'Computing music data and generating queue..' });

                  SpotifyController.getSongsFromSeeds(user.spotify.accessToken, tracks, genres)
                    .then((recommendation) => {
                      updateCallback({ update: 'start-event-progress', progress: 100, message: 'Done!', tracks: recommendation.tracks });
                    })
                  .catch((error) => reject(error));
                })
              .catch((error) => reject(error));
            })
          .catch((error) => reject(error));
      })

    .catch((error) => reject(error));
  }

  return {
    createEvent,
    getAllEventSlugs,
    getAllUserSpecificEvents,
    getEventBySlug,
    getEventById,
    singupUserForEvent,
    removeEventAttendee,
    startEvent
  };
}

module.exports = EventController;
