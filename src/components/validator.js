function Validator() {

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

  function validateSlug(slug) {
    const reg = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
    return reg.test(slug);
  }

  function validateEventBody(body) {
    return new Promise((resolve, reject) => {
      if (!body.title) return reject('Please provide a title that only contains letter and numbers.');
      if (!body.slug || !validateSlug(body.slug)) return reject('Please provide a slug that only contains letters and dashes.');
      if (!body.description) return reject('Please provide a description.');
      if (!body.vibe || !validateVibe(body.vibe)) return reject('Please provide a valid vibe.');
      if (!body.vibeName) return reject('Please provide the name of the vibe.');
      resolve();
    });
  }

  return {
    validateEventBody
  };
}

module.exports = Validator;
