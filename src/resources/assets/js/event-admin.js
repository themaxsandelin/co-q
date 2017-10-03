const startButton = document.getElementById('start-event');
if (startButton) startButton.addEventListener('click', startEvent);

let player;
let playerState;
let progressChecker;
let tracks;
let started = false;

const prev = document.getElementById('prev');
prev.addEventListener('click', previousSong);

const toggle = document.getElementById('toggle');
toggle.addEventListener('click', toggleSongState);

const next = document.getElementById('next');
next.addEventListener('click', nextSong);

function startEvent() {
  socket.send(JSON.stringify({
    action: 'start-event'
  }));
}

function showStartPlayer() {
  document.querySelector('.player-init').classList.add('ready');
  document.getElementById('player-status').innerText = 'Player ready! 🎉';
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
    selectTrackRow(e.track_window.current_track);

    socket.send(JSON.stringify({
      action: 'update-attendee-player',
      player: e
    }));
  });

  player.on('ready', (data) => {
    showStartPlayer();
    player.deviceId = data.device_id;
  });
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
  if (!event.paused) {
    setupProgressChecker();
  } else {
    resetProgressChecker();
  }
}

function resetProgressChecker() {
  if (progressChecker) clearInterval(progressChecker);
  progressChecker = null;
}

function setupProgressChecker() {
  resetProgressChecker();

  progressChecker = setInterval(() => {
    console.log('Check progress.');
    player.getCurrentState().then((state) => {
      playerState = (state.paused) ? 'paused':'playing';
      toggle.classList.value = 'control margin ' + playerState;
      updateTrackProgress(state.position, state.duration);

      socket.send(JSON.stringify({
        action: 'update-attendee-player',
        player: state
      }));
    });
  }, 500);
}


function previousSong() {
  if (!started) return alert('Start playing before changing song.');

  fetch('https://api.spotify.com/v1/me/player/previous', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + spotifyAuth.accessToken,
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    if (response.status !== 204) {
      console.log(response.status);
      console.log('Something went wrong while switch playback device.');
      return;
    }

  }).catch((error) => {
    console.log('Previous song error:');
    console.log(error);
  });
}

function nextSong() {
  if (!started) return alert('Start playing before changing song.');

  fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + spotifyAuth.accessToken,
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    if (response.status !== 204) {
      console.log(response.status);
      console.log('Something went wrong while switch playback device.');
      return;
    }

  }).catch((error) => {
    console.log('Next song error: ');
    console.log(error);
  });
}

function resumePlayback() {
  return new Promise((resolve, reject) => {
    fetch('https://api.spotify.com/v1/me/player/play', {
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

      toggle.classList.value = 'control margin playing';
      resolve();
    }).catch((error) => reject(error));
  });
}

function pausePlayback() {
  return new Promise((resolve, reject) => {
    fetch('https://api.spotify.com/v1/me/player/pause', {
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

      toggle.classList.value = 'control margin paused';
      resolve();
    }).catch((error) => reject(error));
  });
}

function toggleSongState() {
  if (!started) {
    player.setVolume(0.0);

    transferPlayback(player.deviceId)
      .then(() => {
        setTimeout(() => {

          pausePlayback().then(() => {
            player.setVolume(0.2);
            playSongArray(tracks)
              .then(() => {
                console.log('Playing tracks.');
                started = true;
              })
            .catch((error) => {
              console.log('Playback failed.');
              console.log(error);
            });
          }).catch((error) => {
            console.log('Playback failed.');
            console.log(error);
          });

        }, 1000);
      })
    .catch((error) => {
      console.log('Playback transfer error.');
      console.log(error);
    });

  } else {
    if (playerState === 'paused') {
      resumePlayback().then().catch((error) => {
        console.log('Playback failed.');
        console.log(error);
      });
    } else {
      pausePlayback().then().catch((error) => {
        console.log('Playback failed.');
        console.log(error);
      });
    }
  }
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
      body: JSON.stringify({ uris: songs.map((song) => 'spotify:track:' + song.id) })
    }).then((response) => {
      if (response.status !== 204) {
        console.log(response.status);
        return reject('Something went wrong while switch playback device.');
      }

      resolve();
    }).catch((error) => reject(error));
  });
}
