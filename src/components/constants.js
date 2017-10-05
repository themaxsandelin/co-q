function Constants() {
  // Constant weight array used for normalization
  const W = [1, 1, 0, 1/20, 0, 1, 1, 1, 1, 1, 1/140];

  const keys = ['danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'];

  return {
    W,
    keys
  };
}

module.exports = Constants;
