const socket = new WebSocket('ws://localhost:8888/socket/event/' + eventId, 'echo-protocol');

socket.addEventListener('open', () => {
  console.log('Socket connected, wohoo! :D');
});

socket.addEventListener('message', (e) => {
  const message = JSON.parse(e.data);
  console.log('New socket message!');
  console.log(message);

  if (message.update === 'user-connected' || message.update === 'user-disconnected') {
    updateUsersConnected(message.update, [message.user]);
  } else if (message.update === 'all-users-connected') {
    updateUsersConnected(message.update, message.users);
  }
});

function updateUsersConnected(update, users) {
  users.forEach((user) => {
    const userNode = document.querySelector('ul.user-list li[data-user=' + user.uid + ']');
    if (update === 'user-connected' || update === 'all-users-connected') {
      userNode.classList.add('connected');
    } else {
      userNode.classList.remove('connected');
    }
  });
}

const eventPassword = document.getElementById('event-password');

const joinButton = document.getElementById('join-button');
if (joinButton) joinButton.addEventListener('click', attemptJoinEvent);

const leaveButton = document.getElementById('leave-button');
if (leaveButton) leaveButton.addEventListener('click', leaveEvent);

function attemptJoinEvent() {
  let data = {
    eventId: eventId
  };
  if (eventPassword) data.password = eventPassword.value;
  fetch('/join-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then((response) => response.json()).then((json) => {
    if (json.error) return alert(json.error);
    if (json.success) {
      window.location.reload();
    }
  }).catch((error) => {
    console.log('Fetch error: ' + error);
  })
}

function leaveEvent() {
  fetch('/leave-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ eventId: eventId })
  }).then((response) => response.json()).then((json) => {
    if (json.error) return alert(json.error);
    if (json.success) {
      window.location.href = '/';
    }
  }).catch((error) => {
    console.log('Fetch error: ' + error);
  });
}
