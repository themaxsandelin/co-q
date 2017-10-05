let tracks;
let playingIndex = 0;

const init = document.getElementById('player-init');
const startProgress = document.getElementById('start-progress');
const progressStatus = document.getElementById('progress-info');

const playerNode = document.getElementById('player');
const queue = document.getElementById('player-queue');
const tableBody = document.querySelector('#player-queue tbody');
const artwork = document.getElementById('artwork');
const trackName = document.getElementById('track-name');
const artist = document.getElementById('artist');
const trackProgress = document.getElementById('track-progress');
const trackDuration = document.getElementById('track-duration');
const marker = document.getElementById('marker');

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

function showStartProgress() {
  document.querySelector('.player-init').classList.remove('ready');
  document.querySelector('.player-init').classList.add('starting');
  document.getElementById('player-status').innerText = 'Generating song queue..';
}

function updateStartProgress(update) {
  progressStatus.innerText = update.message;
  startProgress.style.transform = 'translate3d(' + update.progress + '%, 0px, 0px)';

  if (update.progress === 100) {
    tracks = update.tracks;
    appendMultipleTracks(update.tracks);
    updatePlayerTrack(update.tracks[0]);

    playerNode.classList.add('display');
    queue.classList.add('display');
    setTimeout(() => {
      init.classList.remove('show');
      setTimeout(() => {
        playerNode.classList.add('show');
      }, 200);
      setTimeout(() => {
        queue.classList.add('show');
        init.classList.remove('display');
      }, 400);
    }, 20);
  }
}

function formatTimeFromMs(time) {
  let seconds = (time) ? (time / 1000):0;
  const minutes = (seconds) ? Math.floor(seconds / 60):0;
  seconds = (seconds) ? Math.round(seconds - (60 * minutes)):0;

  return minutes + ':' + ((seconds < 10) ? '0':'') + seconds;
}

function updateTrackProgress(pos, dur) {
  trackProgress.innerText = formatTimeFromMs(pos);
  trackDuration.innerText = formatTimeFromMs(dur);

  marker.style.transform = 'translate3d(' + ((pos / dur) * 100) + '%, 0px, 0px)';
}

function updatePlayerTrack(track, progress = 0) {
  artwork.style.background = 'url(' + track.album.images[0].url + ') no-repeat center';
  artwork.style.backgroundSize = 'cover';

  trackName.innerText = track.name;

  let artists = '';
  track.artists.forEach((artist, i) => {
    if (i) artists += ', ';
    artists += artist.name;
  });
  artist.innerText = artists;

  updateTrackProgress(progress, track.duration_ms);
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


function appendMultipleTracks(tracks) {
  tracks.forEach((track) => {
    appendTrack(track);
  });
}

function appendTrack(track) {
  tableBody.append(buildTrack(track));
}

function prependTrack(track) {
  tableBody.insertBefore(buildTrack(track), tableBody.childNodes[0]);
}

function buildTrack(track) {
  const row = document.createElement('tr');
  row.setAttribute('data-track', track.id);

  const name = document.createElement('td');
  name.innerText = track.name;
  row.appendChild(name);

  const artist = document.createElement('td');
  let artists = '';
  track.artists.forEach((artist, i) => {
    if (i) artists += ', ';
    artists += artist.name;
  });
  artist.innerText = artists;
  row.appendChild(artist);

  const duration = document.createElement('td');
  duration.innerText = formatTimeFromMs(track.duration_ms);
  row.appendChild(duration);

  return row;
}

function selectTrackRow(track) {
  const row = tableBody.querySelector('tr[data-track="' + track.id + '"]');
  if (row.classList.contains('selected')) return;

  const selected = tableBody.querySelector('tr.selected');
  if (selected) selected.classList.remove('selected');

  row.classList.add('selected');
}

function updateAttendeePlayer(player) {
  updatePlayerTrack(player.track_window.current_track, player.position);
  selectTrackRow(player.track_window.current_track);
}

let socket;
if (isAttending) {
  socket = new WebSocket('ws://' + window.location.host + '/socket/event/' + eventId, 'echo-protocol');

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
    } else if (message.update === 'event-started') {
      showStartProgress();
    } else if (message.update === 'start-event-progress') {
      updateStartProgress(message);
    } else if (message.update === 'player-update') {
      updateAttendeePlayer(message.player);
    }
  });

  socket.addEventListener('close', () => {
    console.log('Socket connection closed :(');
  });
}
