const express = require('express');
const handlebars  = require('express-handlebars');
const helpers = require('handlebars-helpers');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const customHelpers = require('./config/helpers');

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

const hbs = handlebars.create({
    extname: '.hbs',
    helpers: {
        ...helpers(),
        ...customHelpers
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(require('./config/axios'));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ 
    secret: process.env.SESSION_KEY, 
    resave: false,
    saveUninitialized: true,
}));
app.use(cors());

app.use(require('./config'));

app.use(require('./routes'));

app.listen(port, () => {
    console.log(`App running at port ${port}`);
})