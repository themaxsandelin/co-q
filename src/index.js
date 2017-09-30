/**
* Modules
*/
const express = require('express');
const exphbs  = require('express-handlebars');
const request = require('request');
const dotenv = require('dotenv').config();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const moment = require('moment');
const async = require('async');


/**
* Components
*/
const Generator = require('./components/generator.js')();
const FeatureExtractor = require('./components/feature-extractor.js')();
const Formatter = require('./components/formatter.js')();
const SongSelector = require('./components/song-selector.js')();

/**
* Controllers
*/
const SpotifyController = require('./controllers/spotify-controller.js')();
const UserController = require('./controllers/user-controller.js')();
const VibesController = require('./controllers/vibes-controller.js')();
const EventController = require('./controllers/event-controller.js')();

/**
* Helper method
*/
function compareMse(a,b) {
  if (a[1] < b[1])
    return -1;
  if (a[1] > b[1])
    return 1;
  return 0;
}


/**
* Express setup
*/
const app = express();
app.set('view engine', 'handlebars');
app.set('views', './src/resources/views');
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  layoutsDir: './src/resources/views/layouts'
}));

app.use(bodyParser.json({ extended: true }));
app.use(cookieParser());
app.use(helmet());

app.use((req, res, next) => {
  const openUrls = [ '/login', '/callback', '/logIntoSpotify' ];
  let redirect = true;
  openUrls.forEach((url) => {
    if ((url !== '/' && req.originalUrl.indexOf(url) === 0) || (url === '/' && req.originalUrl === url)) {
      redirect = false;
    }
  });

  if (!req.cookies.cqt || !req.cookies.cquid) {
    if (redirect) return res.redirect('/login');
    return next();
  }

  UserController.authenticateUser(req.cookies)
    .then((results) => {

      if (!results.validToken) {
        // Destroy cookies. Redirect to login.
        const expires = moment().subtract(1, 'M').format('ddd, DD MMM YYYY HH:mm:ss') + ' GMT';
        res.setHeader('Set-Cookie', [
          'cqt=; HttpOnly; Path=/; Expires=' + expires,
          'cquid=; HttpOnly; Path=/; Expires=' + expires
        ]);
        if (redirect) return res.redirect('/login');
        next();
      } else {
        if (!redirect) return res.redirect('/');

        // Define the user in the request object.
        req.user = results.user;
        next();
      }
    })
  .catch((error) => {
    console.log(error);
    res.json({ error: error });
  });
});

// Set the siteUrl
app.use((req, res, next) => {
  process.siteUrl = req.protocol + '://' + req.get('Host');
  next();
});


/**
* Routes
*/
app.get('/', (req, res) => {

  VibesController.getAllVibes()
    .then((vibes) => {
      EventController.getAllUserSpecificEvents(req.user)
        .then((results) => {

          res.render('home', {
            user: req.user,
            attendingEvents: results.attendingEvents,
            authorEvents: results.authorEvents,
            vibes: JSON.stringify(vibes),
            vibeNames: Object.keys(vibes)
          });

        })
      .catch((error) => {
        console.log(error);
        res.json({ error: error });
      });
    })
  .catch((error) => {
    console.log(error);
    res.json({ error: error });
  });
});

//DEBUG: Test to get song info from spotify and calculating its MSE
// song_id = '2qvkySfQzsoOnV53YpL7SI';
// auth_token = req.user.spotify.accessToken;
// SpotifyController.getSongInfoById(auth_token, song_id)
//     .then((songInfo) => {
//       keys = [
//         'danceability',
//         'energy',
//         'key',
//         'loudness',
//         'mode',
//         'speechiness',
//         'acousticness',
//         'instrumentalness',
//         'liveness',
//         'valence',
//         'tempo'];
//       infoArray = Formatter.filterObjectToArray(songInfo, keys);
//       x_target = [0.49, 0.88, 4.33, -5.23, 1.00, 0.05, 0.03, 0.37, 0.17, 0.31, 137.76];
//       mse = FeatureExtractor.weightedMse(infoArray, x_target);
//       console.log(mse);
//     })
//   .catch((error) => console.log('Oh Shit!'));

app.post('/create-event', (req, res) => {
  EventController.createEvent(req.body, req.user)
    .then((event) => {
      res.json(event);
    })
  .catch((error) => {
    console.log(error);
    res.json({ error: error });
  });
});

app.get('/event/:slug', (req, res) => {
  EventController.getEventBySlug(req.params.slug, req.user)
    .then((event) => {
    UserController.getAccessTokens()
      .then((tokens) => {        
        SongSelector.getSongsForAllUsers(tokens)
            .then((tracks) => {              
              auth = req.user.spotify;
              keys = ['danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'];
              SpotifyController.getMultipleSongInfosByIds(auth, tracks)
                  .then((data) => {
                    // console.log(data.audio_features[0])
                    var trackFeatures = [];                    
                    data.audio_features.forEach((part) => {                      
                      feature = Formatter.filterObjectToArray(part, keys);                      
                      trackFeatures.push(feature)
                    });
                    //Sort the vibe correctly
                    vibe = [];
                    keys.forEach(function(key) {
                      vibe.push(event.vibe[key]);
                    });
                    var mseAndSongs = [];
                    for (var i=0; i<tracks.length; i++) {
                      track = tracks[i];
                      trackFeature = trackFeatures[i];
                      var mse = FeatureExtractor.weightedMse(trackFeature, vibe);
                      mseAndSongs.push([track, mse]);
                    }
                    mseAndSongs.sort(compareMse); 
                    // trackFeatures.forEach((feature) => {
                    //   mse = FeatureExtractor.weightedMse(info, vibe);
                    //   mseAndSongs.push([track, mse]);
                    // });
                    // mse = FeatureExtractor.weightedMse(info, vibe)
                    // mseAndSongs.push([track, mse]);
                    console.log(mseAndSongs)
                  })
                .catch((error) => reject(error));
              // var mseAndSongs = [];                          
              // async.eachSeries(tracks, (track, callback) => {       
              //   var infosAndSongs = [];                
              //   auth = req.user.spotify;                
              //   SpotifyController.getSongInfoById(auth, track)
              //     .then((data) => {
              //       keys = ['danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'];
              //       info = Formatter.filterObjectToArray(data, keys);
              //       vibe = [];
              //       keys.forEach(function(key) {
              //           vibe.push(event.vibe[key]);
              //       });
              //       mse = FeatureExtractor.weightedMse(info, vibe)
              //       mseAndSongs.push([track, mse]);
                    
              //       //mseAndSongs = mseAndSongs.push([track, mse]);
              //       callback();
              //     })
              //   .catch((error) => callback(error));
              //   }, (error) => {
              //     if (error) return reject(error);
              //     console.log('----DONE')
              //     //Sort the songs in ascending order after the mse
              //     mseAndSongs.sort(compareMse); 
              //     console.log(mseAndSongs);                 
              //   });
            })
          .catch((error) => reject(error));
      })
    .catch((error) => console.log('OH SHIT'));
      res.render('event', {
        user: req.user,
        event: event,
        eventJson: JSON.stringify(event)
      });
    })
  .catch((error) => {
    console.log(error);
    res.json({ error: error });
  });
});

app.post('/join-event', (req, res) => {
  EventController.singupUserForEvent(req.user, req.body)
    .then(() => res.json({ success: true }))
  .catch((error) => {
    console.log(error);
    res.json({ error: error });
  })
});

app.post('/leave-event', (req, res) => {
  EventController.removeEventAttendee(req.user, req.body)
    .then(() => res.json({ success: true }))
  .catch((error) => {
    console.log(error);
    res.json({ error: error });
  })
});


app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logIntoSpotify', (req, res) => {
  res.redirect(Generator.generateAuthorizationUrl());
});

app.get('/logout', (req, res) => {
  UserController.logoutUser(req.user)
    .then(() => {
      const expires = moment().subtract(1, 'M').format('ddd, DD MMM YYYY HH:mm:ss') + ' GMT';
      res.setHeader('Set-Cookie', [
        'cqt=; HttpOnly; Path=/; Expires=' + expires,
        'cquid=; HttpOnly; Path=/; Expires=' + expires
      ]);
      res.redirect('/login');
    })
  .catch((error) => {
    console.log(error);
    res.json({ error: error });
  });
});

app.get('/callback', (req, res) => {
  if (req.query.error) {
    console.log(req.query.error);
    return res.json({ error: req.query.error });
  }

  SpotifyController.getAccessToken(req.query.code)
    .then((auth) => SpotifyController.getAccountInfo(auth))
    .then((data) => {
      if (data.error) {
        console.log(data.error);
        return res.json({ error: data.error });
      }

      UserController.ensureUserExists(data.account)
        .then((user) => {
          UserController.createNewUserLogin(user, data.auth)
            .then((token) => {
              res.setHeader('Set-Cookie', [
                'cqt=' + token + '; HttpOnly; Path=/; Expires=' + moment().add(1, 'month').format('ddd, DD MMM YYYY HH:mm:ss') + 'GMT',
                'cquid=' + user.uid + '; HttpOnly; Path=/; Expires=' + moment().add(1, 'month').format('ddd, DD MMM YYYY HH:mm:ss') + 'GMT'
              ]);
              res.redirect('/');
            })
          .catch((error) => {
            console.log(error);
            res.json({ error: error });
          });

        })
      .catch((error) => {
        console.log(error);
        res.json({ error: error });
      })
    })
  .catch((error) => {
    console.log(error);
    res.json({ error: error });
  });
});


/**
* Server start
*/
app.listen(8888, () => {
  console.log('CO-Q up and running!');
});
