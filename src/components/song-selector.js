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
    return new Promise((resolve, reject) => {
      allTracks = [];
      async.eachSeries(userAuths, (auth, callback) => {        
        SpotifyController.getUserTopTrackIds(auth)
          .then((tracks) => {
            //console.log(tracks)
            allTracks = allTracks.concat(tracks);
            //console.log(allTracks)
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
    //console.log(tracks)
    mseTrackPairs = [];
    for (i = 0; i < tracks.length; i++) {
      //console.log(i);
      track = tracks[i];
      //console.log(i);
      mse = FeatureExtractor.weightedMse(track, targetVibe);
      mseTrackPairs.add([mse, track])
    }
    //console.log(mseTrackPairs)
    return mseTrackPairs
  }

  return {
    getSongsForAllUsers,
    getMostRelevantTracks
  };


}

module.exports = SongSelector;
