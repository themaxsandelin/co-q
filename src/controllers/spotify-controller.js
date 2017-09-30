/**
* Modules
*/
const request = require('request');

/**
* Extend Set
*/
Set.prototype.union = function(setB) {
  var union = new Set(this);
  for (var elem of setB) {
      union.add(elem);
  }
  return union;
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

  function getUserTopGenres(auth) {  
    return new Promise((resolve, reject) => {
      request('https://api.spotify.com/v1/me/top/artists?limit=3', {
        headers: {          
          'Authorization': 'Bearer ' + auth.accessToken,
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
      request('https://api.spotify.com/v1/me/top/tracks?limit=10', {
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

  return {
    getAccessToken,
    getAccountInfo,
    refreshAccessToken,
    getSongInfoById,
    getUserTopGenres,
    getUserTopTrackIds,
    getMultipleSongInfosByIds
  };
}

module.exports = SpotifyController;
