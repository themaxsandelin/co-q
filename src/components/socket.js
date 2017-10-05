// Modules
const WebSocketServer = require('websocket').server;

// Components
const Generator = require('./generator.js')();
const Formatter = require('./formatter.js')();

// Controllers
const UserController = require('../controllers/user-controller.js')();
const EventController = require('../controllers/event-controller.js')();

function Socket(server) {
  const connections = {};
  const wsServer = new WebSocketServer({ httpServer: server, path: '/socket/*', autoAcceptConnections: false });

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

  function sendConnectedUsersToConnection(connections, connection) {
    const users = [];
    if (connections.author) {
      Object.keys(connections.author).forEach((id) => {
        users.push({
          uid: connections.author[id].user.uid,
          name: connections.author[id].name || connections.author[id].username
        });
      });
    }
    if (connections.attendees) {
      Object.keys(connections.attendees).forEach((id) => {
        users.push({
          uid: connections.attendees[id].user.uid,
          name: connections.attendees[id].name || connections.attendees[id].username
        });
      });
    }

    connection.sendUTF(JSON.stringify({
      update: 'all-users-connected',
      users: users
    }));
  }

  function startEvent(connection, ) {
    EventController.startEvent(connection.event, connection.user, (update) => {
      sendConnectionUpdateToAll(connections[connection.event.id], update);
    });
    sendConnectionUpdateToAll(connections[connection.event.id], { update: 'event-started' });
  }

  function sendUpdateToAttendees(connections, update) {
    if (connections.attendees) {
      Object.keys(connections.attendees).forEach((id) => {
        connections.attendees[id].sendUTF(JSON.stringify(update));
      });
    }
  }

  wsServer.on('request', (request) => {
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
            connection.event = event;
            connection.event.id = eventId;
            connection.event.attendees = Formatter.formatEventAttendees(event);
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
            if (!connections[connection.event.id]) connections[connection.event.id] = { author: {}, attendees: {} };
            sendConnectionUpdateToAll(connections[connection.event.id], {
              'update': 'user-connected',
              'user': {
                uid: connection.user.uid,
                name: connection.user.name || connection.user.username
              }
            });
            if (connection.isEventAuthor) {
              connections[connection.event.id].author[connection.id] = connection;
            } else {
              connections[connection.event.id].attendees[connection.id] = connection;
            }
            sendConnectedUsersToConnection(connections[connection.event.id], connection);


            connection.on('message', (message) => {
              const data = JSON.parse(message.utf8Data);
              if (data.action === 'start-event') {
                if (!connection.isEventAuthor) return connection.sendUTF(JSON.stringify({ error: 'invalidRequest', reason: 'You are not the author of this event.' }));

                startEvent(connection);
              } else if (data.action === 'update-attendee-player') {
                sendUpdateToAttendees(connections[connection.event.id], { update: 'player-update', player: data.player });
              }
            });

            connection.on('close', (reasonCode, description) => {
              // console.log('Connection ' + connection.id + ' closed.');
              if (connection.isEventAuthor) {
                delete connections[connection.event.id].author[connection.id];
              } else {
                delete connections[connection.event.id].attendees[connection.id];
              }

              sendConnectionUpdateToAll(connections[connection.event.id], {
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
