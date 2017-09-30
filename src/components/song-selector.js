// Modules
const math = require('mathjs');
const async = require('async');

/**
* Components
*/
const FeatureExtractor = require('./feature-extractor.js')();

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

  function getMostRelevantTracks(tracks, targetVibe) {
    mseTrackPairs = [];
    for (i = 0; i < tracks.length; i++) {
      track = tracks[i]
      mse = FeatureExtractor.weightedMse(track, targetVibe);
      mseTrackPairs.add([mse, track])
    }
    console.log(mseTrackPairs)
    return mseTrackPairs
  }

  return {
    getSongsForAllUsers,
    getMostRelevantTracks
  };


}

module.exports = SongSelector;
