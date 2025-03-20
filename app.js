const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Booking = require('./models/Booking');


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(express.static('public'));

//connecting to database

const MongoDBURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testDB';

mongoose.connect(MongoDBURI, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: MongoStore.create({

mongoUrl: MongoDBURI,
mongooseConnection: db
  }),
  cookie: {
    secure: true,
    httpOnly: true
  }
}));

//HTTP routes
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const userDetails = {

fullName: req.body.fullName,
email: req.body.email,
password: req.body.password,
phone: req.body.phone
  };
  try {

await db.collection('users').insertOne(userDetails);
res.redirect('/login');
  } catch (err) {
console.error(err);
res.redirect('/register');
  }
});
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const query = req.body.loginOption === 'email'

? { email: req.body.email }
: { phone: req.body.phone };

  db.collection('users').findOne(query, (err, user) => {
if (err || !user) {
  // res.redirect('/login');
  res.render('login', { errorMessage: 'Email or phone number not registered.' });
} else {
  req.session.user = {
    _id: user._id,
    loggedIn: true,
    email: user.email,
    phone: user.phone
  };
  res.redirect('/booking');
}
  });
});

app.post('/register', async (req, res) => {
  const userDetails = {
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone
  };

  // Email validation
  const emailRegex = /^[\w-\.]+@(gmail|yahoo)\.com$/;
  if (!emailRegex.test(userDetails.email)) {
    return res.render('register', { error: 'Invalid email format. It should end with gmail.com or yahoo.com.' });
  }

  // Phone number validation
  const phoneRegex = /^\d+$/;
  if (!phoneRegex.test(userDetails.phone)) {
    return res.render('register', { error: 'Invalid phone number format. It should be an integer.' });
  }

  try {
    await db.collection('users').insertOne(userDetails);
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.redirect('/register');
  }
});

app.get('/booking', (req, res) => {
  if (!req.session.user || !req.session.user.loggedIn) {

res.redirect('/login');
  } else {

res.render('dashboard', { userDetails: req.session.user });
  }
});
app.get('/new-booking', (req, res) => {
  if (!req.session.user || !req.session.user.loggedIn) {

res.redirect('/login');
  } else {
res.render('new-booking');
  }
});
app.post('/new-booking', async (req, res) => {
  if (!req.session.user || !req.session.user.loggedIn) {

res.redirect('/login');
  } else {
const bookingData = {
  userId: req.session.user._id,
  passengers: req.body.passengers,
  passengerNames: req.body.passengerNames.split(','),
  source: req.body.source,
  destination: req.body.destination,
  dateOfJourney: req.body.dateOfJourney,
  trainClass: req.body.trainClass
};
const pricePerPassenger = {
  '1st-class': 100,
  '2nd-class': 50,
  'general': 20
};
bookingData.totalPrice = bookingData.passengers * pricePerPassenger[bookingData.trainClass];
const newBooking = new Booking(bookingData);

console.log('Saving booking data:', newBooking);


try {
  await newBooking.save();
  // Passing an array containing the newly created booking to the template
  res.render('booking-details', { bookingData: [newBooking] });
} catch (err) {
  console.error(err);
  if (err.code === 11000) {
    // if Duplicate booking error
    res.render('new-booking', { error: 'A booking with the same details already exists.' });
  } else {
    
    res.redirect('/new-booking');
  }
}
}
});

  app.get('/booking-details', async (req, res) => {
    if (!req.session.user || !req.session.user.loggedIn) {
      res.redirect('/login');
    } else {
      try { //handling exceptions
        const bookingData = await Booking.find({ userId: req.session.user._id });

        const totalPassengers = bookingData.reduce((total, booking) => {
          return total + booking.passengers;
        }, 0);

        console.log('Fetched booking data:', bookingData);

        res.render('booking-details', { bookingData: bookingData || [] });
      } catch (err) {
        console.error(err);
        res.redirect('/booking');
      }
    }
  });

 

  app.post('/cancel-booking', async (req, res) => {
    if (!req.session.user || !req.session.user.loggedIn) {
      res.redirect('/login');
    } else {
      try {
        const bookingId = req.body.bookingId;
        await Booking.updateOne({ _id: bookingId, userId: req.session.user._id }, { $set: { status: 'cancelled' } });
        res.redirect('/booking-details');
      } catch (err) {
        console.error(err);
        res.redirect('/booking-details');
      }
    }
  });

  app.listen(3080, () => {
    console.log('Server started on port 3080');
  });