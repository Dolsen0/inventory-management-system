const { MongoClient } = require('mongodb');
const password = require('./dbPasskey.json');

// Connection URL and options
const url = `mongodb+srv://derekolsen:${password.password}@inv.yfyvqev.mongodb.net`;
const options = { useNewUrlParser: true, useUnifiedTopology: true };

// Create a MongoDB client
const client = new MongoClient(url, options);

// Connect to the MongoDB database
async function connect() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
}

module.exports = { connect, client };
