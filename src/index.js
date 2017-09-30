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


/**
* Components
*/
const Generator = require('./components/generator.js')();


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
  res.send('Hello, ' + req.user.name + '!');
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

  SpotifyController.getAuthToken(req.query.code)
    .then((auth) => SpotifyController.getAccountInfo(auth))
    .then((data) => {
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
