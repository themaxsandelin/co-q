// Modules
const math = require('mathjs');
const async = require('async');

/**
* Controllers
*/
const SpotifyController = require('../controllers/spotify-controller.js')();

function SongSelector() {
  

  function getSongsForAllUsers(userAuths) { 
    //console.log(userAuths) 
    return new Promise((resolve, reject) => {
      allTracks = [];
      async.eachSeries(userAuths, (auth, callback) => {        
        SpotifyController.getUserTopTrackIds(auth)
          .then((tracks) => {
            allTracks = allTracks.concat(tracks);
            callback();
          })
        .catch((error) => callback(error));
        }, (error) => {
          if (error) return reject(error);

          resolve(allTracks);
        });
    });
  }

  return {
    getSongsForAllUsers
  };


}

module.exports = SongSelector;
