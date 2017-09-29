const express = require('express');
const exphbs  = require('express-handlebars');

const app = express();
app.set('view engine', 'handlebars');
app.set('views', './src/resources/views');
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  layoutsDir: './src/resources/views/layouts'
}));

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.listen(3000, () => {
  console.log('CO-Q up and running!');
});
