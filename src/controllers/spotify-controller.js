// Modules
const request = require('request');
const async = require('async');

// Extend Set
Set.prototype.union = function(setB) {
  var union = new Set(this);
  for (var elem of setB) {
      union.add(elem);
  }
  return union;
}

// Constants
const MAX_SEED_GENRES = 2;
const NUM_SONGS_FROM_SEED = 10;
const NUM_TOP_TRACKS = 50;
const NUM_TOP_ARTIST = 50;

// Helper functions
function getRandomInt(min, max) {
  var rnd = Math.floor(Math.random() * (max - min + 1)) + min;
  return rnd
}

function SpotifyController() {

  function getAccessToken(code) {
    return new Promise((resolve, reject) => {
      request.post({
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + new Buffer(process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET).toString('base64')
        },
        form: {
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': process.siteUrl + '/callback'
        }
      }, (error, response, body) => {
        if (error) return reject(error);
        const data = JSON.parse(body);
        if (data.error) return reject(data.error);

        resolve(data);
      });
    });
  }

  function getAccountInfo(auth) {
    return new Promise((resolve, reject) => {
      // auth object.
      // { "access_token": "", "token_type", "Bearer", "expires_in": 3600, "refresh_token": "", "scope": "user-read-email user-read-private" }

      request('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': 'Bearer ' + auth.access_token
        }
      }, (error, response, body) => {
        if (error) return reject(error);

        const data = JSON.parse(body);
        if (data.error) return reject(data.error);

        resolve({
          auth: auth,
          account: data
        });
      });
    });
  }


  function refreshAccessToken(refreshToken) {
    return new Promise((resolve, reject) => {
      request.post('https://accounts.spotify.com/api/token', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + new Buffer(process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET).toString('base64')
        },
        form: {
          'grant_type': 'refresh_token',
          'refresh_token': refreshToken
        }
      }, (error, response, body) => {
        if (error) return reject(error);
        const data = JSON.parse(body);
        if (data.error) return reject(body.error);

        data.refresh_token = refreshToken;
        resolve(data);
      });
    });
  }

  function getSongInfoById(auth, song_id) {
    return new Promise((resolve, reject) => {
      request('https://api.spotify.com/v1/audio-features/' + song_id, {
        headers: {
          'Authorization': 'Bearer ' + auth.accessToken,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, (error, response, body) => {
        if (error) return reject(error);
        const data = JSON.parse(body);

        if (data.error) return reject(data.error);

        resolve(data);

      });
    });
  }

  function getMultipleSongInfosByIds(auth, song_ids) {
    return new Promise((resolve, reject) => {
      song_ids_str = song_ids.join()

      request('https://api.spotify.com/v1/audio-features/?ids=' + song_ids_str, {
        headers: {
          'Authorization': 'Bearer ' + auth,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, (error, response, body) => {
        if (error) return reject(error);

        const data = JSON.parse(body);

        if (data.error) return reject(data.error);

        //Verify that audio features were received
        try {
          if (data.audio_features[0] == null) return reject('No trackInfo received from Spotify api in getMultipleSongInfosByIds.');  
        }
        catch(e) {
          return reject('Invalid data from Spotify api in getMultipleSongInfosByIds.');
        }      
        resolve(data);

      });
    });
  }

  function getUserTopGenres(auth) {
    return new Promise((resolve, reject) => {
      request('https://api.spotify.com/v1/me/top/artists?limit='+NUM_TOP_ARTIST, {
        headers: {
          'Authorization': 'Bearer ' + auth,
          'Accept': 'application/json'
        }
      }, (error, response, body) => {

        if (error) return reject(error);

        const data = JSON.parse(body);

        if (data.error) return reject(data.error);

        var artists = data.items;
        var genres = new Set();

        for (i = 0; i < artists.length; i++) {
          tmp_set = new Set(artists[i].genres);
          genres = genres.union(tmp_set);
        }

        resolve(genres);

      });
    });
  }

    function getUserTopTrackIds(auth) {

    return new Promise((resolve, reject) => {
      request('https://api.spotify.com/v1/me/top/tracks?limit='+NUM_TOP_TRACKS, {
        headers: {
          'Authorization': 'Bearer ' + auth,
          'Accept': 'application/json'
        }
      }, (error, response, body) => {
        if (error) return reject(error);
        const data = JSON.parse(body);

        if (data.error) return reject(data.error);

        track_ids = [];
        var tracks = data.items;
        for (i = 0; i < tracks.length; i++) {
          track_ids.push(tracks[i].id);
        }

        resolve(track_ids);

      });
    });
  }

  function getSongsFromSeeds(auth, seedTracks, seedGenres) {
    return new Promise((resolve, reject) => {
      baseUrl = 'https://api.spotify.com/v1/recommendations?';
      market = 'market=SE';
      seed = '&seed_tracks='+seedTracks.join();
      seed = seed + '&seed_genres=' + seedGenres.join();
      limit = '&limit=' + NUM_SONGS_FROM_SEED;
      req_url = baseUrl + market + seed + limit;

      request(req_url, {
        headers: {
          'Authorization': 'Bearer ' + auth,
          'Accept': 'application/json'
        }
      }, (error, response, body) => {
        if (error) return reject(error);
        const data = JSON.parse(body);

        if (data.error) return reject(data.error);

        resolve(data);

      });
    });
  }

  function getMultipleUserTopGenres(tokens) {
    return new Promise((resolve, reject) => {
      let genres = [];
      async.eachSeries(tokens, (token, callback) => {
        getUserTopGenres(token)
          .then((userGenres) => {
            genres = genres.concat(userGenres);
            callback();
          })
        .catch((error) => callback());
      }, (error) => {
        if (error) return reject(error);

        resolve(genres);
      });
    });
  }

  function getTopGenresForEvent(tokens) {
    return new Promise((resolve, reject) => {
      getMultipleUserTopGenres(tokens)
        .then((userGenreList) => {

          const userGenreStats = {};
          userGenreList.forEach((userGenres) => {
            userGenres.forEach((genre) => {
              if (!userGenreStats[genre]) userGenreStats[genre] = 0;
              userGenreStats[genre]++;
            });
          });

          const genres = [];
          Object.keys(userGenreStats).forEach((key) => {
            genres.push({ popularity: userGenreStats[key], genre: key });
          });

          genres.sort((a, b) => {
            if (a.popularity < b.popularity) return 1;
            if (a.popularity > b.popularity) return -1;
            return 0;
          });

          const filtered = [];
          for (let i = 0; i < MAX_SEED_GENRES; i++) {
            const index = getRandomInt(0, 10);
            filtered.push(genres[index]);
            genres.splice(index, 1);
          }

          resolve(filtered);
        })
      .catch((error) => reject(error));
    });
  }

  function getTrackById(trackId) {
    return new Promise((resolve, reject) => {

    });
  }

  return {
    getAccessToken,
    getAccountInfo,
    refreshAccessToken,
    getSongInfoById,
    getUserTopGenres,
    getUserTopTrackIds,
    getMultipleSongInfosByIds,
    getSongsFromSeeds,
    getMultipleUserTopGenres,
    getTopGenresForEvent,
    getTrackById
  };
}

module.exports = SpotifyController;
