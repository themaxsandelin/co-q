// Models
const Vibes = require('../models/vibes.js')();

//Controllers
const SpotifyController = require('./spotify-controller.js')();

//Components
const Formatter = require('../components/formatter.js')();
const Constants = require('../components/constants.js')();
const HelperFunctions = require('../components/helper-functions.js')();

function VibesController() {

  function getAllVibes() {
    return new Promise((resolve, reject) => {
      Vibes.getAll()
        .then((vibes) => resolve(vibes))
      .catch((error) => reject(error));
    });
  }

  function getAllVibeNames() {
    return new Promise((resolve, reject) => {
      Vibes.getAll()
        .then((vibes) => resolve(Object.keys(vibes)))
      .catch((error) => reject(error));
    });
  }

  /**
  * Generates a custom vibe based on the submitted track ids
  * @param {Array} tracks
  * @param {string} vibeName
  * @return {Object} vibe
  */
  function generateVibeFromTracks(auth, tracks, vibeName) {
    const keys = Constants.keys;
    return new Promise((resolve, reject) => {
      // Verify that the input is valid
      if (!Array.isArray(tracks)) return reject('Please provide an array of track ids.');
      if (tracks.length == 0) return reject('List of tracks cannot be empty.');
      if (!(typeof vibeName === 'string')) return reject('Please provide a string as vibe name.');
      if (HelperFunctions.stringIsEmpty(vibeName)) return reject('vibeName for custom vibe must be a nonempty string!');
      
      //Get track info for all tracks
      SpotifyController.getMultipleSongInfosByIds(auth, tracks)
        .then((trackInfo) => {
          //trackInfo is object from parsed JSON string -> We need to extract the relevant information
          var trackFeatures = [];
          trackInfo.audio_features.forEach((part) => {
            if(part != null) {
              feature = Formatter.filterObjectToArray(part, keys);
              trackFeatures.push(feature);
            }
          });          
          
          //Calculate the mean for each parameter. NOTE: Vibes are stored non-normalized!          
          var params = {};
          for (var i_key = 0; i_key < keys.length; i_key++) { 

            //Extract value of one key for all tracks         
            valuesForKey = [];
            for (var i_track = 0; i_track < trackFeatures.length; i_track++) {
              valuesForKey.push(trackFeatures[i_track][i_key]);
            }
            
            //Calculate mean and save it
            mean = HelperFunctions.arrayMean(valuesForKey);
            params[keys[i_key]] = mean;
          }
          //Construct the vibe and resolve it
          var vibe = {'name' : vibeName, 'parameters' : params};          
          resolve(vibe);
        })

        .catch((error) => reject(error))

    })

  }

  return {
    getAllVibes,
    getAllVibeNames,
    generateVibeFromTracks
  };
}

module.exports = VibesController;
