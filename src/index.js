/**
* Modules
*/
const express = require('express');
const exphbs  = require('express-handlebars');
const request = require('request');
const dotenv = require('dotenv').config();


/**
* Components
*/
const Factory = require('./components/factory.js')();


/**
* Controllers
*/
const SpotifyController = require('./controllers/spotify-controller.js')();
const UserController = require('./controllers/user-controller.js')();


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
app.use((req, res, next) => {
  process.siteUrl = req.protocol + '://' + req.get('Host');
  next();
});


/**
* Routes
*/
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/login', (req, res) => {
  res.redirect(Factory.generateAuthorizationUrl());
});

app.get('/callback', (req, res) => {
  if (req.query.error) {
    console.log(req.query.error);
    return res.json({ error: req.query.error });
  }

  SpotifyController.getAuthToken(req.query.code)
    .then((auth) => SpotifyController.getAccountInfo(auth))
    .then((data) => {
      console.log(data);
      if (data.error) {
        console.log(data.error);
        return res.json({ error: data.error });
      }
      // data keys => { auth, account }

      // Auth process
      //
      // 1. Check if user exists in Firebase auth.
      //    1a. If it does not, create the user and a user object in the DB.
      //    1b. If it does exist, generate a new JWT and add it to Firebase and save it in a cookie.
      //
      // 2. Update the user object's properties for access token with the new access data taken from the Spotify SDK

      UserController.ensureUserExists(data.account)
        .then((user) => {

          // Try to generate JWT and store in a browser cookie
          UserController.createNewUserLogin(user)
            .then((token) => {
              console.log(token);
            })
          .catch((error) => reject(error));

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
