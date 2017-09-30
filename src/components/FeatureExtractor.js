// Modules
const math = require('mathjs');

function FeatureExtractor() {
  // Constant weight array used for normalization
  W = [1, 1, 0, 1/20, 0, 1, 1, 1, 1, 1, 1/140];

  function weightedMse(x_song, x_target) {
    //Normalize song and target vector values
    x_song_norm = math.dotMultiply(x_song, W);
    x_target_norm = math.dotMultiply(x_target, W);
    //Calculate MSE between song and target
    e = math.subtract(x_song_norm,x_target_norm);
    se = math.dotPow(e, 2);
    mse = math.mean(se);
    return mse;
  }

  function jsonToInfoVector(json) {
    info = [
      json.danceability,
      json.energy,
      json.key,
      json.loudness,
      json.mode,
      json.speechiness,
      json.acousticness,
      json.instrumentalness,
      json.liveness,
      json.valence,
      json.tempo];
    return info;
  }

  return {
    weightedMse,
    jsonToInfoVector
  };
}

module.exports = Generator;
