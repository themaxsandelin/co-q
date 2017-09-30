function Validator() {

  function validateTitle(title) {
    const reg = /^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/;
    return reg.test(title);
  }

  function isNumber(num) {
    return isFinite(num) && !isNaN(parseFloat(num));
  }

  function validateVibe(vibe) {
    const required = [
      'danceability',
      'energy',
      'key',
      'loudness',
      'mode',
      'speechiness',
      'acousticness',
      'instrumentalness',
      'liveness',
      'valence',
      'tempo'
    ];

    let valid = true;
    required.forEach((key) => {
      if (vibe[key] === undefined) valid = false;
      if (!isNumber(vibe[key])) valid = false;
    });

    return valid;
  }

  function validateEventBody(body) {
    return new Promise((resolve, reject) => {
      if (!validateTitle) return reject('Please provide a title that only contains letter and numbers.');
      if (!body.description) return reject('Please provide a description.');
      if (!validateVibe(body.vibe)) return reject('Please provide a valid vibe.');
      resolve();
    });
  }

  return {
    validateEventBody
  };
}

module.exports = Validator;
