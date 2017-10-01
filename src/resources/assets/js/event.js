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
    console.log(json);
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
    console.log(json);
  }).catch((error) => {
    console.log('Fetch error: ' + error);
  });
}
