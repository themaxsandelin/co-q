// Modules
const math = require('mathjs');
const async = require('async');

/**
* Controllers
*/
const SpotifyController = require('../controllers/spotify-controller.js')();

function SongSelector() {

  //Debug list of user_ids
  

  function getTopSongsForAllUsers(userAuths) {      
    return new Promise((resolve, reject) => {
      async.eachSeries(userAuths, (id, callback) => {
        SpotifyController.getUserTopTrackIds(id)
          .then((topTracks) => {            
            console.log(topTracks);
            callback();
          })
        .catch((error) => callback(error));
        }, (error) => {
          if (error) return reject(error);

          resolve('events');
        });
    });
  }

  return {
    getTopSongsForAllUsers
  };


}

module.exports = SongSelector;
