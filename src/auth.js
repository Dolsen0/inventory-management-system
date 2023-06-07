const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { client } = require('./db');

passport.use(new LocalStrategy(
  async function(username, password, done) {
    const db = client.db('inventory_management');
    const usersCollection = db.collection('users');

    try {
      const user = await usersCollection.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);  // Passport will attach this 'user' to 'req.user'
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function(id, done) {
  const db = client.db('inventory_management');
  const usersCollection = db.collection('users');

  try {
    const user = await usersCollection.findOne({ _id: id });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
