function Factory() {

  function generateAuthorizationUrl() {
    const baseUrl = 'https://accounts.spotify.com/authorize';
    const scope = 'user-read-private user-read-email';
    let url = baseUrl;
    url += '?client_id=' + process.env.SPOTIFY_ID;
    url += '&response_type=code';
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(process.siteUrl + '/callback');
    return url;
  }

  return {
    generateAuthorizationUrl
  };
}

module.exports = Factory;
