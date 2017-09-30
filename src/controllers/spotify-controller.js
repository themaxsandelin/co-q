/**
* Modules
*/
const request = require('request');

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
      base_url = 'https://api.spotify.com/v1/audio-features/';
      req_url = base_url + song_id;
      request('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': 'Bearer ' + auth.access_token,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, (error, response, body) => {
        if (error) return reject(error);

        const data = JSON.parse(body);
        if (data.error) return reject(data.error);

        resolve({
          songInfoJson: data
        });

      });
    });
  }

  return {
    getAccessToken,
    getAccountInfo,
    refreshAccessToken,
    getSongInfoById
  };
}

module.exports = SpotifyController;
