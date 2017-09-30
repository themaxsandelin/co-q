function Formatter() {

  function formatObjectKeys(source) {
    const obj = {};
    const keys = Object.keys(source);
    keys.forEach((key) => {
      let newKey = '';
      if (key.indexOf('_') > -1) {
        const strings = key.split('_');
        strings.forEach((str, i) => {
          newKey += (!i) ? str:(str.charAt(0).toUpperCase() + str.slice(1));
        });
      }
      if (newKey) {
        obj[newKey] = source[key];
      } else {
        obj[key] = source[key];
      }
    });
    return obj;
  }

  function formatObjectKeysMuli(list) {
    const results = [];
    list.forEach((obj) => {
      results.push(formatObjectKeys(obj));
    });
    return results;
  }

  function filterObject(raw, keys) {
    return Object.keys(raw).filter(key => keys.includes(key)).reduce((obj, key) => {
      obj[key] = raw[key];
      return obj;
    }, {});
  }

  function filterObjects(array, keys) {
    const results = [];
    array.forEach((item) => {
      results.push(filterObject(item, keys));
    });
    return results;
  }

  return {
    formatObjectKeys,
    formatObjectKeysMuli,
    filterObject,
    filterObjects
  };
}

module.exports = Formatter;
