const startButton = document.getElementById('start-event');
if (startButton) startButton.addEventListener('click', startEvent);

let player;
let playerState;
let progressChecker;
let tracks;
let playingIndex;

const artwork = document.getElementById('artwork');
const trackName = document.getElementById('track-name');
const artist = document.getElementById('artist');
const progress = document.getElementById('progress');
const duration = document.getElementById('duration');
const marker = document.getElementById('marker');
const tableBody = document.querySelector('#player-queue tbody');

const prev = document.getElementById('prev');
prev.addEventListener('click', previousSong);

const toggle = document.getElementById('toggle');
toggle.addEventListener('click', toggleSongState);

const next = document.getElementById('next');
next.addEventListener('click', nextSong);

function startEvent() {
  fetch('/start-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ eventId: eventId })
  }).then((response) => response.json()).then((results) => {
    if (results.error) return alert(results.error);
    tracks = results;

    playSongArray(tracks.map((song) => 'spotify:track:' + song.id))
      .then(() => {
        playingIndex = 0;
        selectTrackRow();
        console.log('Song playing.');
      })
    .catch((error) => {
      console.log('Failed to play songs.');
      console.log(erorr);
    });

    appendMultipleTracks(tracks);
  }).catch((error) => {
    console.log('Fetch error: ' + error);
  });
}

function onSpotifyPlayerAPIReady() {

  player = new Spotify.Player({
    name: 'Co-Q Player',
    getOauthToken: (callback) => {
      callback(spotifyAuth.accessToken);
    },
    volume: 0.5
  });

  player.connect();

  // player.on('initialization_failed', (e) => { console.log('Initialization Failed', e); });
  // player.on('authentication_error', (e) => { console.log('Authentication Error', e); });
  // player.on('account_error', (e) => { console.log('Account Error', e); });
  // player.on('playback_error', (e) => { console.log('Playback Error', e); });

  player.on('player_state_changed', (e) => {
    updatePlayer(e);
  });

  player.on('ready', (data) => {
    transferPlayback(data.device_id)
      .then(() => {
        console.log('Play songs!');
      })
    .catch((error) => {
      console.log('Playback transfer error.');
      console.log(error);
    });
  });
}

function transferPlayback(deviceId) {
  return new Promise((resolve, reject) => {
    fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { 'Authorization': 'Bearer ' + spotifyAuth.accessToken }
    }).then((response) => response.json()).then((results) => {
      let playerExists = false;
      results.devices.forEach((device) => { if (device.id === deviceId) playerExists = true; });
      if (!playerExists) return reject('Device not found in available devices.');

      fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + spotifyAuth.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ids: [deviceId] })
      }).then((response) => {
        if (response.status !== 204) {
          console.log(response.status);
          return reject('Something went wrong while switch playback device.');
        }

        resolve();
      }).catch((error) => reject(error));

    }).catch((error) => reject(error));
  });
}

function playSongArray(songs) {
  return new Promise((resolve, reject) => {
    fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + spotifyAuth.accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: songs })
    }).then((response) => {
      if (response.status !== 204) {
        console.log(response.status);
        return reject('Something went wrong while switch playback device.');
      }

      resolve();
    }).catch((error) => reject(error));
  });
}

function formatTimeFromMs(time) {
  let seconds = (time / 1000);
  const minutes = Math.floor(seconds / 60);
  seconds = Math.round(seconds - (60 * minutes));

  return minutes + ':' + ((seconds < 10) ? '0':'') + seconds;
}

function updatePlayer(event) {
  const track = event.track_window.current_track;

  artwork.style.background = 'url(' + track.album.images[2].url + ') no-repeat center';
  artwork.style.backgroundSize = 'cover';

  trackName.innerText = track.name;

  let artists = '';
  track.artists.forEach((artist, i) => {
    if (i) artists += ', ';
    artists += artist.name;
  });
  artist.innerText = artists;

  updateTrackProgress(event.position, track.duration_ms);
  setupProgressChecker();
}

function setupProgressChecker() {
  if (progressChecker) clearInterval(progressChecker);

  progressChecker = setInterval(() => {
    player.getCurrentState().then((state) => {
      playerState = (state.paused) ? 'paused':'playing';
      toggle.classList.value = 'control margin ' + playerState;
      updateTrackProgress(state.position, state.duration);
    });
  }, 500);
}

function updateTrackProgress(pos, dur) {
  progress.innerText = formatTimeFromMs(pos);
  duration.innerText = formatTimeFromMs(dur);

  marker.style.transform = 'translate3d(' + ((pos / dur) * 100) + '%, 0px, 0px)';
}


function previousSong() {
  fetch('https://api.spotify.com/v1/me/player/previous', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + spotifyAuth.accessToken,
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    if (response.status !== 204) {
      console.log(response.status);
      return reject('Something went wrong while switch playback device.');
    }

    if (playingIndex) {
      playingIndex--;
      selectTrackRow();
    }
    console.log('Previos song!');
  }).catch((error) => {
    console.log('Previous song error:');
    console.log(error);
  });
}


function toggleSongState() {
  const newState = (playerState === 'paused') ? 'playing':'paused';
  const url = 'https://api.spotify.com/v1/me/player/' + ((playerState === 'paused') ? 'play':'pause');
  fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + spotifyAuth.accessToken,
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    if (response.status !== 204) {
      console.log(response.status);
      return reject('Something went wrong while switch playback device.');
    }

    toggle.classList.value = 'control margin ' + newState;
  }).catch((error) => reject(error));
}

function nextSong() {
  fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + spotifyAuth.accessToken,
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    if (response.status !== 204) {
      console.log(response.status);
      return reject('Something went wrong while switch playback device.');
    }

    playingIndex++;
    selectTrackRow();
    console.log('Next song!');
  }).catch((error) => {
    console.log('Next song error: ');
    console.log(error);
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

function selectTrackRow() {
  const rows = tableBody.querySelectorAll('tr');
  const selected = tableBody.querySelector('tr.selected');
  if (selected) selected.classList.remove('selected');

  rows[playingIndex].classList.add('selected');
}
