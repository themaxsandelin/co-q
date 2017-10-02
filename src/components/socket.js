// Modules
const WebSocketServer = require('websocket').server;

// Controllers
const UserController = require('../controllers/user-controller.js')();
const EventController = require('../controllers/event-controller.js')();

// Components
const Generator = require('./generator.js')();

function Socket(server) {
  const connections = {};
  const wsServer = new WebSocketServer({ httpServer: server, path: '/socket/*', autoAcceptConnections: false });

  function validateSocketOrigin(request) {
    const origin = request.remoteAddress.replace(/^.*:/, '');
    return (origin === '127.0.0.1' || origin === '1'); // Make sure it's on the same network.
  }

  function sendConnectionUpdateToAll(connectionObj, update) {
    if (connectionObj.author) {
      Object.keys(connectionObj.author).forEach((id) => {
        connectionObj.author[id].sendUTF(JSON.stringify(update));
      });
    }
    if (connectionObj.attendees) {
      Object.keys(connectionObj.attendees).forEach((id) => {
        connectionObj.attendees[id].sendUTF(JSON.stringify(update));
      });
    }
  }

  wsServer.on('request', (request) => {
    if (!validateSocketOrigin(request)) return request.reject();

    let hasToken = false;
    let hasUid = false;
    const cookies = {};
    request.cookies.forEach((cookie) => {
      if (cookie.name === 'cqt') {
        hasToken = true;
        cookies.cqt = cookie.value;
      } else if (cookie.name === 'cquid') {
        hasUid = true;
        cookies.cquid = cookie.value;
      }
    });
    if (!hasToken || !hasUid) return request.reject();

    UserController.authenticateUser(cookies)
      .then((results) => {
        if (!results.validToken) return request.reject();
        const user = results.user;

        const path = request.resource.replace('/socket', '');
        if (path.indexOf('/event/') === -1) return request.reject();

        const eventId = path.replace('/event/', '');
        EventController.getEventById(eventId, user)
          .then((event) => {
            const connection = request.accept('echo-protocol', request.origin);
            connection.id = Generator.generateUniqueString(64);
            connection.eventId = eventId;
            connection.isEventAuthor = event.isAuthor;
            connection.user = user;
            // console.log('New connection created width ID ' + connection.id);
            /*
              Connections: {
                eventId: {
                  author: {
                    connectionId: connection
                  },
                  attendees: {
                    connectionId: connection,
                    connectionId: connection,
                    connectionId: connection
                  }
                }
              }

              Create the connection Object like this to more easily send event updates to everyone connected to that event.
            */
            if (!connections[eventId]) connections[eventId] = { author: {}, attendees: {} };
            sendConnectionUpdateToAll(connections[connection.eventId], {
              'update': 'user-connected',
              'user': {
                uid: connection.user.uid,
                name: connection.user.name || connection.user.username
              }
            });

            if (connection.isEventAuthor) {
              connections[connection.eventId].author[connection.id] = connection;
            } else {
              connections[connection.eventId].attendees[connection.id] = connection;
            }
            // console.log(connections);

            connection.on('close', (reasonCode, description) => {
              // console.log('Connection ' + connection.id + ' closed.');
              if (connection.isEventAuthor) {
                delete connections[connection.eventId].author[connection.id];
              } else {
                delete connections[connection.eventId].attendees[connection.id];
              }

              sendConnectionUpdateToAll(connections[connection.eventId], {
                'update': 'user-disconnected',
                'user': {
                  uid: connection.user.uid,
                  name: connection.user.name || connection.user.username
                }
              });
            });
          })
        .catch((error) => {
          console.log(error);
          return request.reject();
        });
      })
    .catch((error) => {
      console.log(error);
      return request.reject();
    });
  });

  return {
    WebSocketServer
  }
}

module.exports = Socket;
