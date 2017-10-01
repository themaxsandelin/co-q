// Modules
const math = require('mathjs');
const async = require('async');

/**
* Components
*/
const FeatureExtractor = require('./feature-extractor.js')();
const Formatter = require('../components/formatter.js')();

/**
* Controllers
*/
const SpotifyController = require('../controllers/spotify-controller.js')();

/**
* Helper methods
*/
function compareMse(a,b) {
  if (a[1] < b[1])
    return -1;
  if (a[1] > b[1])
    return 1;
  return 0;
}

function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

/**
* Constants
*/
const NUM_TOP_TRACKS = 50;
const MAX_SEED_TRACKS = 3;
const keys = ['danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'];

function SongSelector() {


  function getSongsForAllUsers(userAuths) {
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

      track = tracks[i];

      mse = FeatureExtractor.weightedMse(track, targetVibe);
      mseTrackPairs.add([mse, track])
    }

    return mseTrackPairs
  }


  function getTopTracksForEvent(event, tokens) {
    return new Promise((resolve, reject) => {

              getSongsForAllUsers(tokens)
                .then((tracks_) => {
                  //Prevent duplicates if people have tracks in common
                  tracks = uniq(tracks_)

                  //Sort the vibe correctly
                  vibe = [];
                  keys.forEach(function(key) {
                    vibe.push(event.vibe[key]);
                  });

                  //Extract auth
                  auth = tokens[0];

                  //Split tracks into separate arrays
                  splitTracks = [];
                  var tracksToSplice = tracks.slice();
                  numUsers = tokens.length;
                  for (var i=0; i<numUsers; i++) {
                    if (tracksToSplice.length > numUsers) {
                      tmpArray = tracksToSplice.splice(0, NUM_TOP_TRACKS);
                    } else {
                      tmpArray = tracksToSplice;
                    }
                    splitTracks.push(tmpArray);
                  }


                  //Container for the track infos
                  trackInfos = [];

                  //Get trackinfo for each subset
                  async.eachSeries(splitTracks, (someTracks, callback) => {
                    SpotifyController.getMultipleSongInfosByIds(auth, someTracks)
                      .then((trackInfo) => {

                        //Extract only the relevant features of each track (defined by $keys)
                        var trackFeatures = [];
                        trackInfo.audio_features.forEach((part) => {
                          if(part != null) {
                            feature = Formatter.filterObjectToArray(part, keys);
                            trackFeatures.push(feature);
                          }
                        });

                        trackInfos = trackInfos.concat(trackFeatures)

                        callback();
                      })
                    .catch((error) => callback(error));
                    }, (error) => {
                      if (error) return reject(error);

                      //Calculate MSE for each track and add tuples [trackId, MSE] in a list
                      var mseAndTracks = [];

                      for (var i=0; i<tracks.length; i++) {

                        trackFeature = trackInfos[i];

                        if (trackFeature != null) {
                          track = tracks[i];

                          var mse = FeatureExtractor.weightedMse(trackFeature, vibe);

                          mseAndTracks.push([track, mse]);
                        }
                      }

                      //Sort in ascending order based on MSE
                      mseAndTracks.sort(compareMse);

                      //Extract the best tracks to use for seed
                      bestTracks = []
                      var havePlentyOfTracks = (mseAndTracks.length > MAX_SEED_TRACKS);
                      if (havePlentyOfTracks) {
                        for (var i=0; i<MAX_SEED_TRACKS; i++) {
                          bestTracks.push(mseAndTracks[i][0]);
                        }
                      } else {
                        mseAndTracks.forEach((track) => bestTracks.push(track));
                      }

                      resolve(bestTracks);
                  });

                })
              .catch((error) => reject('getSongsForAllUsers failed'));
            })
          .catch((error) => console.log('OH SHIT'));
  }

  return {
    getSongsForAllUsers,
    getMostRelevantTracks,
    getTopTracksForEvent
  };


}

module.exports = SongSelector;
