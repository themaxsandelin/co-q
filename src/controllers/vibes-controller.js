// Models
const Vibes = require('../models/vibes.js')();

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

  return {
    getAllVibes,
    getAllVibeNames
  };
}

module.exports = VibesController;
