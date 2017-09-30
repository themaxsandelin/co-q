// Modules
const math = require('mathjs');

function FeatureExtractor() {
  // Constant weight array used for normalization
  W = [1, 1, 0, 1/20, 0, 1, 1, 1, 1, 1, 1/140];

  function weightedMse(x_song, x_target) {
    //console.log(x_song);
    //Normalize song and target vector values
    x_song_norm = math.dotMultiply(x_song, W);
    //console.log(x_song_norm)
    x_target_norm = math.dotMultiply(x_target, W);
    //console.log(x_target_norm)
    //Calculate MSE between song and target
    e = math.subtract(x_song_norm,x_target_norm);
    //console.log(e)
    se = math.dotPow(e, 2);
    mse = math.mean(se);
    return mse;
  }

  return {
    weightedMse,
  };
}

module.exports = FeatureExtractor;
