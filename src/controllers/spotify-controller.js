/**
* Modules
*/
const request = require('request');

function SpotifyController() {

  function getAuthToken(code) {
    return new Promise((resolve, reject) => {
      console.log(code);
      request.post({
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + new Buffer(process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET).toString('base64')
        },
        form: {
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': process.siteUrl + process.env.REDIRECT_PATH
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

  return {
    getAuthToken,
    getAccountInfo
  };
}

module.exports = SpotifyController;
