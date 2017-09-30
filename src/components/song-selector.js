// Modules
const math = require('mathjs');

function SongSelector() {

  //Debug list of user_ids
  

  function getTopSongsForAllUsers(user_auths) {    
    return new Promise((resolve, reject) => {
      top_songs_for_all_users = [];      
      for (i = 0; i < user_auths.length; i++) {
          user_auth = user_auths[i];
          getUserTopTrackIds(auth)       
      }
      resolve('Kalle');
    });
  }

  return {
    getTopSongsForAllUsers
  };


}

module.exports = SongSelector;
