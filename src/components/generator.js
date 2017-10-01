// Modules
const crypto = require('crypto');
const moment = require('moment');

function Generator() {

  function generateAuthorizationUrl() {
    const baseUrl = 'https://accounts.spotify.com/authorize';
    const scope = 'user-read-private user-read-email user-top-read user-read-birthdate streaming user-modify-playback-state user-read-playback-state';
    let url = baseUrl;
    url += '?client_id=' + process.env.SPOTIFY_ID;
    url += '&response_type=code';
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(process.siteUrl + '/callback');
    return url;
  }

  function generateUniqueString(length) {
    const now = moment();

    const date = now.format('YYYYMMDDHHmmss');
    const chars = crypto.randomBytes((length - date.length) / 2).toString('hex').split('');
    for (let i = 0; i < date.length; i++) {
      const index = (chars.length - 1) - ((date.length - 1) - i);
      chars.splice(index, 0, date[i]);
    }

    return chars.join('');
  }

  return {
    generateAuthorizationUrl,
    generateUniqueString
  };
}

module.exports = Generator;
